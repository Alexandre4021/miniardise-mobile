<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Support;

/** Montants en unités mineures (centimes), comme la Store API. */
final class Money {
	public static function toMinor( float $amount, int $decimals = 2 ): int {
		return (int) round( $amount * ( 10 ** $decimals ) );
	}
}
