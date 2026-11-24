<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Auth;

/**
 * Reconnaît le client à partir de « Authorization: Bearer <jeton> » (ADR-02),
 * UNIQUEMENT sur les routes de l'app : Store API et miniardise-mobile.
 * Aucun cookie n'est créé : pas de session web, pas de CSRF possible.
 */
final class BearerAuthenticator {
	/** Préfixes de routes REST autorisés pour le jeton de l'app. */
	public const ALLOWED_ROUTES = array( '/wc/store/', '/miniardise-mobile/v1/' );

	private bool $invalidTokenPresented = false;

	public function __construct( private readonly TokenService $tokens ) {}

	public function register(): void {
		add_filter( 'determine_current_user', array( $this, 'determineCurrentUser' ), 20 );
		add_filter( 'rest_authentication_errors', array( $this, 'authenticationErrors' ), 20 );
	}

	/** @param int|false $userId */
	public function determineCurrentUser( $userId ) {
		$token = self::bearerToken( $_SERVER );
		if ( null === $token || ! self::isAppRoute( self::currentRestRoute() ) ) {
			return $userId;
		}
		if ( ! self::transportIsSecure() ) {
			$this->invalidTokenPresented = true;
			return $userId;
		}
		$id = $this->tokens->authenticate( $token );
		if ( null === $id ) {
			$this->invalidTokenPresented = true;
			return $userId;
		}
		return $id;
	}

	/**
	 * Un jeton présenté mais invalide ou expiré donne une 401 explicite : l'app sait qu'elle
	 * doit rafraîchir sa session au lieu de continuer silencieusement en invité.
	 *
	 * @param mixed $result
	 * @return mixed
	 */
	public function authenticationErrors( $result ) {
		if ( ! empty( $result ) || ! $this->invalidTokenPresented ) {
			return $result;
		}
		return new \WP_Error( 'mm_invalid_token', 'Session expirée.', array( 'status' => 401 ) );
	}

	/** @param array<string, mixed> $server */
	public static function bearerToken( array $server ): ?string {
		$header = $server['HTTP_AUTHORIZATION'] ?? $server['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
		if ( ! is_string( $header ) || 1 !== preg_match( '/^Bearer\s+([A-Za-z0-9]{16,128})$/', trim( $header ), $m ) ) {
			return null;
		}
		return $m[1];
	}

	public static function isAppRoute( string $route ): bool {
		foreach ( self::ALLOWED_ROUTES as $prefix ) {
			if ( str_starts_with( $route, $prefix ) ) {
				return true;
			}
		}
		return false;
	}

	/** Route REST demandée, que l'URL soit /wp-json/... ou ?rest_route=... */
	private static function currentRestRoute(): string {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['rest_route'] ) && is_string( $_GET['rest_route'] ) ) {
			return '/' . ltrim( sanitize_text_field( wp_unslash( $_GET['rest_route'] ) ), '/' );
		}
		// phpcs:enable
		$path   = (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? (string) $_SERVER['REQUEST_URI'] : '', PHP_URL_PATH );
		$prefix = '/' . trim( rest_get_url_prefix(), '/' );
		$home   = rtrim( (string) wp_parse_url( home_url(), PHP_URL_PATH ), '/' );
		$base   = $home . $prefix;
		return str_starts_with( $path, $base . '/' ) ? substr( $path, strlen( $base ) ) : '';
	}

	private static function transportIsSecure(): bool {
		return is_ssl() || 'local' === wp_get_environment_type();
	}
}
