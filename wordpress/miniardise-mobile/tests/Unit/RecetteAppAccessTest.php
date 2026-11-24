<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Tests\Unit;

use MiniarDise\Mobile\Staging\RecetteAppAccess;
use PHPUnit\Framework\TestCase;

final class RecetteAppAccessTest extends TestCase {
	private const SALT = 'sel-de-test';

	public function test_only_app_api_paths_are_eligible(): void {
		self::assertTrue( RecetteAppAccess::isAppApiPath( '/wp-json/wc/store/v1/products' ) );
		self::assertTrue( RecetteAppAccess::isAppApiPath( '/wp-json/miniardise-mobile/v1/config' ) );
		self::assertFalse( RecetteAppAccess::isAppApiPath( '/wp-admin/' ) );
		self::assertFalse( RecetteAppAccess::isAppApiPath( '/wp-json/wp/v2/users' ) );
		self::assertFalse( RecetteAppAccess::isAppApiPath( '/boutique/' ) );
	}

	public function test_code_matches_stored_hash_or_constant(): void {
		$hash = RecetteAppAccess::hashCode( 'code-recette-123', self::SALT );
		self::assertTrue( RecetteAppAccess::codeMatches( 'code-recette-123', $hash, null, self::SALT ) );
		self::assertTrue( RecetteAppAccess::codeMatches( 'constante-456789', '', 'constante-456789', self::SALT ) );
		self::assertFalse( RecetteAppAccess::codeMatches( 'mauvais', $hash, null, self::SALT ) );
		self::assertFalse( RecetteAppAccess::codeMatches( '', $hash, '', self::SALT ) );
		self::assertFalse( RecetteAppAccess::codeMatches( 'x', '', null, self::SALT ) );
	}
}
