<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Tests\Unit;

use MiniarDise\Mobile\Auth\TokenRecord;
use MiniarDise\Mobile\Auth\TokenRepository;
use MiniarDise\Mobile\Security\RateLimitStore;
use MiniarDise\Mobile\Support\Clock;

final class FakeClock implements Clock {
	public function __construct( public int $t = 1_800_000_000 ) {}
	public function now(): int {
		return $this->t;
	}
	public function advance( int $s ): void {
		$this->t += $s;
	}
}

final class InMemoryTokenRepository implements TokenRepository {
	/** @var array<string, TokenRecord> */
	public array $rows = array();

	public function insert( TokenRecord $record, int $now ): void {
		$this->rows[ $record->hash ] = $record;
	}
	public function findByHash( string $hash ): ?TokenRecord {
		return $this->rows[ $hash ] ?? null;
	}
	public function markUsed( string $hash, int $now ): bool {
		$r = $this->rows[ $hash ] ?? null;
		if ( null === $r || null !== $r->usedAt ) {
			return false;
		}
		$this->rows[ $hash ] = new TokenRecord( $r->hash, $r->kind, $r->userId, $r->familyId, $r->expiresAt, $now, $r->revokedAt, $r->deviceLabel );
		return true;
	}
	public function revokeFamily( string $familyId, int $now ): void {
		$this->revokeWhere( fn( TokenRecord $r ) => $r->familyId === $familyId, $now );
	}
	public function revokeUser( int $userId, int $now ): void {
		$this->revokeWhere( fn( TokenRecord $r ) => $r->userId === $userId, $now );
	}
	public function purgeExpired( int $now ): int {
		return 0;
	}
	private function revokeWhere( callable $match, int $now ): void {
		foreach ( $this->rows as $h => $r ) {
			if ( $match( $r ) && null === $r->revokedAt ) {
				$this->rows[ $h ] = new TokenRecord( $r->hash, $r->kind, $r->userId, $r->familyId, $r->expiresAt, $r->usedAt, $now, $r->deviceLabel );
			}
		}
	}
}

final class InMemoryRateLimitStore implements RateLimitStore {
	/** @var array<string, int> */
	public array $hits = array();
	public function hit( string $bucket, int $windowStart ): int {
		$k                = $bucket . '@' . $windowStart;
		$this->hits[ $k ] = ( $this->hits[ $k ] ?? 0 ) + 1;
		return $this->hits[ $k ];
	}
	public function purgeBefore( int $timestamp ): void {}
}
