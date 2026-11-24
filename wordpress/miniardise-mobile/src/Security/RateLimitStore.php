<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Security;

interface RateLimitStore {
	/** Incrémente le compteur de la fenêtre et retourne la nouvelle valeur. */
	public function hit( string $bucket, int $windowStart ): int;

	public function purgeBefore( int $timestamp ): void;
}
