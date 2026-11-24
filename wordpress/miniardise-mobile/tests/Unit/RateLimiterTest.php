<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Tests\Unit;

use MiniarDise\Mobile\Security\RateLimiter;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/Fakes.php';

final class RateLimiterTest extends TestCase {
	public function test_blocks_after_limit_and_reopens_next_window(): void {
		$clock   = new FakeClock( 1_800_000_000 );
		$store   = new InMemoryRateLimitStore();
		$limiter = new RateLimiter( $store, $clock );

		for ( $i = 0; $i < 5; $i++ ) {
			self::assertTrue( $limiter->attempt( 'login_email', 'a@b.fr', 5, 900 )['allowed'] );
		}
		$blocked = $limiter->attempt( 'login_email', 'a@b.fr', 5, 900 );
		self::assertFalse( $blocked['allowed'] );
		self::assertGreaterThan( 0, $blocked['retry_after'] );

		$clock->advance( 900 );
		self::assertTrue( $limiter->attempt( 'login_email', 'a@b.fr', 5, 900 )['allowed'] );
	}

	public function test_keys_and_scopes_are_independent_and_hashed(): void {
		$store   = new InMemoryRateLimitStore();
		$limiter = new RateLimiter( $store, new FakeClock() );
		$limiter->attempt( 'login_email', 'a@b.fr', 1, 900 );
		self::assertTrue( $limiter->attempt( 'login_email', 'c@d.fr', 1, 900 )['allowed'] );
		self::assertTrue( $limiter->attempt( 'login_ip', 'a@b.fr', 1, 900 )['allowed'] );
		foreach ( array_keys( $store->hits ) as $k ) {
			self::assertStringNotContainsString( '@b.fr', explode( '@', $k, 2 )[0] );
		}
	}
}
