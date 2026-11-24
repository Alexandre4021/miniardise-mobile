<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Tests\Unit;

use MiniarDise\Mobile\Rest\HomeController;
use PHPUnit\Framework\TestCase;

final class HomeControllerTest extends TestCase {
	public function test_slide_keeps_only_http_links_and_normalizes_fit(): void {
		$s = HomeController::slide( 7, 'https://x/i.jpg', 1200, 800, 'Salon', 'Nouveau', 'javascript:alert(1)', '', 'contain' );
		self::assertSame( '', $s['link'] );
		self::assertSame( 'contain', $s['fit'] );
		$s = HomeController::slide( 7, 'https://x/i.jpg', 1200, 800, 'Salon', 'Nouveau', 'https://epiceriefineminiardise.fr/boutique/', 'cover', 'contain' );
		self::assertSame( 'https://epiceriefineminiardise.fr/boutique/', $s['link'] );
		self::assertSame( 'cover', $s['fit'] );
	}

	public function test_badge_is_truncated(): void {
		$s = HomeController::slide( 1, 'https://x/i.jpg', 1, 1, '', str_repeat( 'é', 60 ), '', 'zoom', 'contain' );
		self::assertSame( 40, mb_strlen( (string) $s['badge'] ) );
		self::assertSame( 'contain', $s['fit'] );
	}
}
