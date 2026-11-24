<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Auth;

final class TokenPair {
	public function __construct(
		public readonly string $accessToken,
		public readonly int $accessExpiresAt,
		public readonly string $refreshToken,
		public readonly int $refreshExpiresAt,
	) {}

	/** @return array<string, int|string> */
	public function toArray(): array {
		return array(
			'access_token'       => $this->accessToken,
			'access_expires_at'  => $this->accessExpiresAt,
			'refresh_token'      => $this->refreshToken,
			'refresh_expires_at' => $this->refreshExpiresAt,
			'token_type'         => 'Bearer',
		);
	}
}
