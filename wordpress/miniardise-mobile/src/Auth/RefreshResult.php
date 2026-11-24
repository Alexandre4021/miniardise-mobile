<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Auth;

enum RefreshResult: string {
	case Ok      = 'ok';
	case Invalid = 'invalid';
	case Expired = 'expired';
	case Reused  = 'reused'; // vol probable : toute la famille est révoquée
}
