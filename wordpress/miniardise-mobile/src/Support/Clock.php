<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Support;

interface Clock {
	public function now(): int;
}
