<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Install;

/**
 * Tables propres à l'extension (préfixe WordPress + mm_). Migrations versionnées par mm_db_version.
 */
final class Schema {

	public static function install(): void {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$charset = $wpdb->get_charset_collate();
		$p       = $wpdb->prefix;

		// Jetons stockés HACHÉS (SHA-256). Jamais le jeton en clair.
		dbDelta(
			"CREATE TABLE {$p}mm_tokens (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				token_hash CHAR(64) NOT NULL,
				kind VARCHAR(10) NOT NULL,
				user_id BIGINT UNSIGNED NOT NULL,
				family_id CHAR(32) NOT NULL,
				device_label VARCHAR(100) NOT NULL DEFAULT '',
				created_at INT UNSIGNED NOT NULL,
				expires_at INT UNSIGNED NOT NULL,
				used_at INT UNSIGNED NULL,
				revoked_at INT UNSIGNED NULL,
				PRIMARY KEY  (id),
				UNIQUE KEY token_hash (token_hash),
				KEY family_id (family_id),
				KEY user_id (user_id),
				KEY expires_at (expires_at)
			) $charset;"
		);

		dbDelta(
			"CREATE TABLE {$p}mm_rate_limits (
				bucket CHAR(64) NOT NULL,
				window_start INT UNSIGNED NOT NULL,
				hits INT UNSIGNED NOT NULL DEFAULT 0,
				PRIMARY KEY  (bucket, window_start)
			) $charset;"
		);

		// Journal de sécurité : jamais de mot de passe, jeton ni e-mail en clair.
		dbDelta(
			"CREATE TABLE {$p}mm_security_log (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				created_at INT UNSIGNED NOT NULL,
				event VARCHAR(50) NOT NULL,
				user_id BIGINT UNSIGNED NULL,
				ip_hash CHAR(64) NOT NULL DEFAULT '',
				context VARCHAR(255) NOT NULL DEFAULT '',
				PRIMARY KEY  (id),
				KEY event (event),
				KEY created_at (created_at)
			) $charset;"
		);

		update_option( 'mm_db_version', MM_DB_VERSION, false );

		if ( ! wp_next_scheduled( 'mm_daily_cleanup' ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'mm_daily_cleanup' );
		}
	}
}
