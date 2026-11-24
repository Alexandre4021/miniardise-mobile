<?php
/**
 * Désinstallation : supprime uniquement les données propres à l'extension.
 * Aucune donnée WooCommerce (clients, commandes, produits) n'est touchée.
 */

declare(strict_types=1);

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;
foreach ( array( 'mm_tokens', 'mm_rate_limits', 'mm_security_log' ) as $table ) {
	$wpdb->query( 'DROP TABLE IF EXISTS `' . esc_sql( $wpdb->prefix . $table ) . '`' ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
}
delete_option( 'mm_db_version' );
