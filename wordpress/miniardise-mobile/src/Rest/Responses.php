<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Rest;

final class Responses {
	/** @param array<string, mixed> $data */
	public static function ok( array $data, int $status = 200 ): \WP_REST_Response {
		$r = new \WP_REST_Response( $data, $status );
		$r->header( 'Cache-Control', 'no-store, private' );
		return $r;
	}

	public static function error( string $code, string $message, int $status, int $retryAfter = 0 ): \WP_Error {
		$data = array( 'status' => $status );
		if ( $retryAfter > 0 ) {
			$data['retry_after'] = $retryAfter;
		}
		return new \WP_Error( $code, $message, $data );
	}
}
