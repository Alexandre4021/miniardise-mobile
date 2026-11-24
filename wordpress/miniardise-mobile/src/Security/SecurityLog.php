<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Security;

/**
 * Journal des événements de sécurité. L'IP est hachée avec un sel du site ;
 * aucun mot de passe, jeton ni e-mail n'est enregistré.
 */
final class SecurityLog {
	public const LOGIN_FAILED   = 'login_failed';
	public const LOGIN_OK       = 'login_ok';
	public const RATE_LIMITED   = 'rate_limited';
	public const REFRESH_REUSED = 'refresh_reused';
	public const LOGOUT         = 'logout';
	public const REVOKED_ALL    = 'revoked_all';

	public function __construct( private readonly \wpdb $db ) {}

	public function record( string $event, ?int $userId, string $ip, string $context = '' ): void {
		$this->db->insert(
			$this->db->prefix . 'mm_security_log',
			array(
				'created_at' => time(),
				'event'      => substr( $event, 0, 50 ),
				'user_id'    => $userId,
				'ip_hash'    => hash_hmac( 'sha256', $ip, wp_salt( 'auth' ) ),
				'context'    => substr( $context, 0, 255 ),
			),
			array( '%d', '%s', '%d', '%s', '%s' )
		);
	}

	public function purgeOlderThan( int $days ): void {
		$table = $this->db->prefix . 'mm_security_log';
		$this->db->query( $this->db->prepare( "DELETE FROM {$table} WHERE created_at < %d", time() - $days * 86400 ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	}
}
