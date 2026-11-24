<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Tests\Unit;

use MiniarDise\Mobile\Auth\BearerAuthenticator;
use PHPUnit\Framework\TestCase;

final class BearerAuthenticatorTest extends TestCase {
	public function test_reads_bearer_token_from_server_vars(): void {
		$t = str_repeat( 'ab', 32 );
		self::assertSame( $t, BearerAuthenticator::bearerToken( array( 'HTTP_AUTHORIZATION' => "Bearer $t" ) ) );
		self::assertSame( $t, BearerAuthenticator::bearerToken( array( 'REDIRECT_HTTP_AUTHORIZATION' => "Bearer $t" ) ) );
	}

	public function test_ignores_other_schemes_and_garbage(): void {
		self::assertNull( BearerAuthenticator::bearerToken( array() ) );
		self::assertNull( BearerAuthenticator::bearerToken( array( 'HTTP_AUTHORIZATION' => 'Basic dXNlcjpwYXNz' ) ) );
		self::assertNull( BearerAuthenticator::bearerToken( array( 'HTTP_AUTHORIZATION' => "Bearer x' OR 1=1" ) ) );
	}

	public function test_token_is_only_accepted_on_app_routes(): void {
		self::assertTrue( BearerAuthenticator::isAppRoute( '/wc/store/v1/cart' ) );
		self::assertTrue( BearerAuthenticator::isAppRoute( '/miniardise-mobile/v1/me' ) );
		self::assertFalse( BearerAuthenticator::isAppRoute( '/wp/v2/users' ) );
		self::assertFalse( BearerAuthenticator::isAppRoute( '/wc/v3/orders' ) );
		self::assertFalse( BearerAuthenticator::isAppRoute( '/miniardise-mobile/v1x/' ) );
		self::assertFalse( BearerAuthenticator::isAppRoute( '' ) );
	}

	public function test_invalid_token_always_yields_401_even_with_cookie_session(): void {
		self::assertNull( BearerAuthenticator::decideAuthError( null, false ) );
		self::assertTrue( BearerAuthenticator::decideAuthError( true, false ) );
		$e = BearerAuthenticator::decideAuthError( true, true );
		self::assertInstanceOf( \WP_Error::class, $e );
		self::assertSame( 401, $e->get_error_data()['status'] );
		$existing = new \WP_Error( 'x', 'y' );
		self::assertSame( $existing, BearerAuthenticator::decideAuthError( $existing, true ) );
	}
}
