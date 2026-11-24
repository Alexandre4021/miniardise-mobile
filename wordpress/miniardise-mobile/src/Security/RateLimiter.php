<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Security;

use MiniarDise\Mobile\Support\Clock;

/**
 * Limitation de débit à fenêtre fixe, stockée en base (pas de Redis sur l'hébergement mutualisé).
 * La clé (IP, compte…) est hachée : aucune donnée personnelle en clair.
 */
final class RateLimiter {
	public function __construct(
		private readonly RateLimitStore $store,
		private readonly Clock $clock,
	) {}

	/** @return array{allowed: bool, retry_after: int} */
	public function attempt( string $scope, string $key, int $limit, int $windowSeconds ): array {
		$now         = $this->clock->now();
		$windowStart = $now - ( $now % $windowSeconds );
		$hits        = $this->store->hit( hash( 'sha256', $scope . '|' . $key ), $windowStart );
		return array(
			'allowed'     => $hits <= $limit,
			'retry_after' => $hits <= $limit ? 0 : ( $windowStart + $windowSeconds - $now ),
		);
	}
}
