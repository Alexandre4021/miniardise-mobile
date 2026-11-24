<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Security;

/**
 * Adresse IP du client. Par défaut REMOTE_ADDR uniquement : un en-tête X-Forwarded-For
 * envoyé par le client ne doit pas permettre de contourner la limitation de débit.
 * Si LWS confirme un proxy de confiance, l'en-tête pourra être activé par le filtre
 * « mm_client_ip ».
 */
final class ClientIp {
	/** @param array<string, mixed> $server */
	public static function from( array $server ): string {
		$ip = isset( $server['REMOTE_ADDR'] ) && is_string( $server['REMOTE_ADDR'] ) ? $server['REMOTE_ADDR'] : '';
		$ip = false !== filter_var( $ip, FILTER_VALIDATE_IP ) ? $ip : '0.0.0.0';
		return function_exists( 'apply_filters' ) ? (string) apply_filters( 'mm_client_ip', $ip, $server ) : $ip;
	}
}
