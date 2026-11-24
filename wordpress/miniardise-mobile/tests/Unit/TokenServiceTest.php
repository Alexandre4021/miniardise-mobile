<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Tests\Unit;

use MiniarDise\Mobile\Auth\RefreshResult;
use MiniarDise\Mobile\Auth\TokenService;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/Fakes.php';

final class TokenServiceTest extends TestCase {
	private FakeClock $clock;
	private InMemoryTokenRepository $repo;
	private TokenService $svc;

	protected function setUp(): void {
		$this->clock = new FakeClock();
		$this->repo  = new InMemoryTokenRepository();
		$this->svc   = new TokenService( $this->repo, $this->clock );
	}

	public function test_issued_access_token_authenticates_the_user(): void {
		$pair = $this->svc->issue( 42, 'iPhone' );
		self::assertSame( 42, $this->svc->authenticate( $pair->accessToken ) );
	}

	public function test_only_hashes_are_stored(): void {
		$pair = $this->svc->issue( 42 );
		foreach ( $this->repo->rows as $hash => $row ) {
			self::assertNotSame( $pair->accessToken, $hash );
			self::assertNotSame( $pair->refreshToken, $hash );
			self::assertSame( 64, strlen( $hash ) );
		}
		self::assertArrayHasKey( TokenService::hash( $pair->accessToken ), $this->repo->rows );
	}

	public function test_access_token_expires_after_15_minutes(): void {
		$pair = $this->svc->issue( 42 );
		$this->clock->advance( TokenService::ACCESS_TTL );
		self::assertNull( $this->svc->authenticate( $pair->accessToken ) );
	}

	public function test_refresh_token_cannot_be_used_as_access_token(): void {
		$pair = $this->svc->issue( 42 );
		self::assertNull( $this->svc->authenticate( $pair->refreshToken ) );
	}

	public function test_malformed_or_unknown_tokens_are_rejected(): void {
		self::assertNull( $this->svc->authenticate( '' ) );
		self::assertNull( $this->svc->authenticate( "' OR 1=1 --" ) );
		self::assertNull( $this->svc->authenticate( str_repeat( 'a', 64 ) ) );
	}

	public function test_refresh_rotates_both_tokens(): void {
		$first                    = $this->svc->issue( 42 );
		[ $result, $second, $uid ] = $this->svc->refresh( $first->refreshToken );
		self::assertSame( RefreshResult::Ok, $result );
		self::assertSame( 42, $uid );
		self::assertNotNull( $second );
		self::assertNotSame( $first->refreshToken, $second->refreshToken );
		self::assertSame( 42, $this->svc->authenticate( $second->accessToken ) );
	}

	public function test_reusing_a_refresh_token_revokes_the_whole_family(): void {
		$first          = $this->svc->issue( 42 );
		[ , $second ]   = $this->svc->refresh( $first->refreshToken );
		[ $result ]     = $this->svc->refresh( $first->refreshToken ); // rejeu par un voleur
		self::assertSame( RefreshResult::Reused, $result );
		self::assertNull( $this->svc->authenticate( $second->accessToken ) );
		[ $again ] = $this->svc->refresh( $second->refreshToken );
		self::assertSame( RefreshResult::Invalid, $again );
	}

	public function test_expired_refresh_token_is_refused(): void {
		$pair = $this->svc->issue( 42 );
		$this->clock->advance( TokenService::REFRESH_TTL + 1 );
		[ $result, $newPair ] = $this->svc->refresh( $pair->refreshToken );
		self::assertSame( RefreshResult::Expired, $result );
		self::assertNull( $newPair );
	}

	public function test_logout_revokes_only_the_current_device(): void {
		$phone  = $this->svc->issue( 42, 'iPhone' );
		$tablet = $this->svc->issue( 42, 'Android' );
		$this->svc->revokeByAccessToken( $phone->accessToken );
		self::assertNull( $this->svc->authenticate( $phone->accessToken ) );
		self::assertSame( 42, $this->svc->authenticate( $tablet->accessToken ) );
	}

	public function test_revoke_user_logs_out_every_device_of_that_user_only(): void {
		$a     = $this->svc->issue( 42 );
		$b     = $this->svc->issue( 42 );
		$other = $this->svc->issue( 7 );
		$this->svc->revokeUser( 42 );
		self::assertNull( $this->svc->authenticate( $a->accessToken ) );
		self::assertNull( $this->svc->authenticate( $b->accessToken ) );
		self::assertSame( 7, $this->svc->authenticate( $other->accessToken ) );
	}

	public function test_tokens_are_256_bit_hex(): void {
		$pair = $this->svc->issue( 1 );
		self::assertMatchesRegularExpression( '/^[a-f0-9]{64}$/', $pair->accessToken );
		self::assertMatchesRegularExpression( '/^[a-f0-9]{64}$/', $pair->refreshToken );
	}
}
