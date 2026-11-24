<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Tests\Unit;

use MiniarDise\Mobile\Account\OrderPresenter;
use MiniarDise\Mobile\Catalog\Reviews;
use MiniarDise\Mobile\Rest\AccountController;
use PHPUnit\Framework\TestCase;

final class AccountTest extends TestCase {
	public function test_a_customer_never_sees_another_customers_order(): void {
		self::assertTrue( OrderPresenter::belongsTo( new \WC_Order( 42 ), 42 ) );
		self::assertFalse( OrderPresenter::belongsTo( new \WC_Order( 42 ), 7 ) );
		self::assertFalse( OrderPresenter::belongsTo( new \WC_Order( 0 ), 0 ) ); // commande invité
		self::assertFalse( OrderPresenter::belongsTo( null, 42 ) );
	}

	public function test_formatted_address_lines(): void {
		self::assertSame( array( 'Jean Dupont', '6 rue des Tartres', '95240 Cormeilles' ), OrderPresenter::lines( 'Jean Dupont<br/>6 rue des Tartres<br>95240 Cormeilles<br/>' ) );
	}

	public function test_address_validation(): void {
		$ok = AccountController::sanitizeAddress( array( 'country' => 'fr', 'postcode' => '95240', 'city' => '<b>Cormeilles</b>', 'unknown' => 'x' ) );
		self::assertSame( array( 'postcode' => '95240', 'city' => 'Cormeilles', 'country' => 'FR' ), $ok );
		self::assertArrayHasKey( 'error', AccountController::sanitizeAddress( array( 'country' => 'France' ) ) );
		self::assertArrayHasKey( 'error', AccountController::sanitizeAddress( array( 'postcode' => "95240'; DROP" ) ) );
	}

	public function test_review_shape_is_safe(): void {
		$r = Reviews::shape( 5, 6166, 'Mélange &amp; sportif', ' Marie ', 9, '<p>Très bon <script>alert(1)</script></p>', '2026-11-20 10:00:00', true, 'javascript:x' );
		self::assertSame( 5, $r['rating'] ); // borné à 5
		self::assertSame( 'Très bon', $r['text'] );
		self::assertSame( 'Mélange & sportif', $r['product_name'] );
		self::assertSame( 'Marie', $r['author'] );
		self::assertSame( '', $r['photo'] );
		self::assertSame( '2026-11-20T10:00:00+00:00', $r['date'] );
	}
}
