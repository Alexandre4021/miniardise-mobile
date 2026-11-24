<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Auth;

interface TokenRepository {
	public function insert( TokenRecord $record, int $now ): void;

	public function findByHash( string $hash ): ?TokenRecord;

	/** Marque un jeton de rafraîchissement comme utilisé. Retourne false s'il l'était déjà (course). */
	public function markUsed( string $hash, int $now ): bool;

	public function revokeFamily( string $familyId, int $now ): void;

	public function revokeUser( int $userId, int $now ): void;

	public function purgeExpired( int $now ): int;
}
