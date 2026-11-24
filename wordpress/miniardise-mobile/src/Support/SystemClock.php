<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Support;

final class SystemClock implements Clock {
	public function now(): int {
		return time();
	}
}
