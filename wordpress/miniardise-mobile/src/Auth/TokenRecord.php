<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Auth;

final class TokenRecord {
	public function __construct(
		public readonly string $hash,
		public readonly string $kind,
		public readonly int $userId,
		public readonly string $familyId,
		public readonly int $expiresAt,
		public readonly ?int $usedAt = null,
		public readonly ?int $revokedAt = null,
		public readonly string $deviceLabel = '',
	) {}
}
