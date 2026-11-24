<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Auth;

/**
 * Persistance des jetons via $wpdb (requêtes préparées uniquement).
 */
final class WpdbTokenRepository implements TokenRepository {
	private string $table;

	public function __construct( private readonly \wpdb $db ) {
		$this->table = $db->prefix . 'mm_tokens';
	}

	public function insert( TokenRecord $r, int $now ): void {
		$this->db->insert(
			$this->table,
			array(
				'token_hash'   => $r->hash,
				'kind'         => $r->kind,
				'user_id'      => $r->userId,
				'family_id'    => $r->familyId,
				'device_label' => $r->deviceLabel,
				'created_at'   => $now,
				'expires_at'   => $r->expiresAt,
			),
			array( '%s', '%s', '%d', '%s', '%s', '%d', '%d' )
		);
	}

	public function findByHash( string $hash ): ?TokenRecord {
		$row = $this->db->get_row(
			$this->db->prepare( "SELECT * FROM {$this->table} WHERE token_hash = %s LIMIT 1", $hash ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);
		if ( ! is_array( $row ) ) {
			return null;
		}
		return new TokenRecord(
			(string) $row['token_hash'],
			(string) $row['kind'],
			(int) $row['user_id'],
			(string) $row['family_id'],
			(int) $row['expires_at'],
			null === $row['used_at'] ? null : (int) $row['used_at'],
			null === $row['revoked_at'] ? null : (int) $row['revoked_at'],
			(string) $row['device_label']
		);
	}

	public function markUsed( string $hash, int $now ): bool {
		// Mise à jour conditionnelle : atomique face à deux rafraîchissements simultanés.
		$updated = $this->db->query(
			$this->db->prepare( "UPDATE {$this->table} SET used_at = %d WHERE token_hash = %s AND used_at IS NULL", $now, $hash ) // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);
		return 1 === $updated;
	}

	public function revokeFamily( string $familyId, int $now ): void {
		$this->db->query(
			$this->db->prepare( "UPDATE {$this->table} SET revoked_at = %d WHERE family_id = %s AND revoked_at IS NULL", $now, $familyId ) // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);
	}

	public function revokeUser( int $userId, int $now ): void {
		$this->db->query(
			$this->db->prepare( "UPDATE {$this->table} SET revoked_at = %d WHERE user_id = %d AND revoked_at IS NULL", $now, $userId ) // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);
	}

	public function purgeExpired( int $now ): int {
		// On garde 7 jours après expiration pour pouvoir détecter une réutilisation tardive.
		return (int) $this->db->query(
			$this->db->prepare( "DELETE FROM {$this->table} WHERE expires_at < %d", $now - 7 * 86400 ) // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);
	}
}
