<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Auth;

use MiniarDise\Mobile\Support\Clock;

/**
 * Jetons opaques révocables (ADR-02).
 * - accès : 15 min ; rafraîchissement : 30 jours, rotatif (usage unique) ;
 * - un jeton de rafraîchissement réutilisé révoque toute la famille (détection de vol) ;
 * - seuls les hachages SHA-256 sont stockés.
 */
final class TokenService {
	public const ACCESS_TTL  = 900;
	public const REFRESH_TTL = 2592000;
	public const ACCESS      = 'access';
	public const REFRESH     = 'refresh';

	/** @var callable(int): string */
	private $random;

	/** @param null|callable(int): string $random */
	public function __construct(
		private readonly TokenRepository $repo,
		private readonly Clock $clock,
		?callable $random = null,
	) {
		$this->random = $random ?? static fn( int $bytes ): string => random_bytes( $bytes );
	}

	public static function hash( string $token ): string {
		return hash( 'sha256', $token );
	}

	public function issue( int $userId, string $deviceLabel = '' ): TokenPair {
		return $this->issueInFamily( $userId, bin2hex( ( $this->random )( 16 ) ), $deviceLabel );
	}

	/** Retourne l'identifiant client si le jeton d'accès est valide, sinon null. */
	public function authenticate( string $accessToken ): ?int {
		if ( ! self::looksValid( $accessToken ) ) {
			return null;
		}
		$r = $this->repo->findByHash( self::hash( $accessToken ) );
		if ( null === $r || self::ACCESS !== $r->kind || null !== $r->revokedAt || $r->expiresAt <= $this->clock->now() ) {
			return null;
		}
		return $r->userId;
	}

	/** @return array{0: RefreshResult, 1: ?TokenPair, 2: ?int} résultat, nouvelle paire, client */
	public function refresh( string $refreshToken ): array {
		if ( ! self::looksValid( $refreshToken ) ) {
			return array( RefreshResult::Invalid, null, null );
		}
		$now  = $this->clock->now();
		$hash = self::hash( $refreshToken );
		$r    = $this->repo->findByHash( $hash );
		if ( null === $r || self::REFRESH !== $r->kind || null !== $r->revokedAt ) {
			return array( RefreshResult::Invalid, null, null );
		}
		if ( null !== $r->usedAt || ! $this->repo->markUsed( $hash, $now ) ) {
			$this->repo->revokeFamily( $r->familyId, $now );
			return array( RefreshResult::Reused, null, $r->userId );
		}
		if ( $r->expiresAt <= $now ) {
			return array( RefreshResult::Expired, null, $r->userId );
		}
		return array( RefreshResult::Ok, $this->issueInFamily( $r->userId, $r->familyId, $r->deviceLabel ), $r->userId );
	}

	/** Déconnexion de l'appareil qui présente ce jeton d'accès. */
	public function revokeByAccessToken( string $accessToken ): void {
		if ( ! self::looksValid( $accessToken ) ) {
			return;
		}
		$r = $this->repo->findByHash( self::hash( $accessToken ) );
		if ( null !== $r ) {
			$this->repo->revokeFamily( $r->familyId, $this->clock->now() );
		}
	}

	/** Déconnexion de tous les appareils (changement de mot de passe, suppression de compte…). */
	public function revokeUser( int $userId ): void {
		$this->repo->revokeUser( $userId, $this->clock->now() );
	}

	private function issueInFamily( int $userId, string $familyId, string $deviceLabel ): TokenPair {
		$now     = $this->clock->now();
		$access  = bin2hex( ( $this->random )( 32 ) );
		$refresh = bin2hex( ( $this->random )( 32 ) );
		$label   = mb_substr( trim( $deviceLabel ), 0, 100 );

		$this->repo->insert( new TokenRecord( self::hash( $access ), self::ACCESS, $userId, $familyId, $now + self::ACCESS_TTL, null, null, $label ), $now );
		$this->repo->insert( new TokenRecord( self::hash( $refresh ), self::REFRESH, $userId, $familyId, $now + self::REFRESH_TTL, null, null, $label ), $now );

		return new TokenPair( $access, $now + self::ACCESS_TTL, $refresh, $now + self::REFRESH_TTL );
	}

	private static function looksValid( string $token ): bool {
		return 1 === preg_match( '/^[a-f0-9]{64}$/', $token );
	}
}
