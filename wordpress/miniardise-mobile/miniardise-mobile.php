<?php
/**
 * Plugin Name:       MiniarDise Mobile
 * Description:       API sécurisée de l'application mobile Épicerie Fine MiniarDise (authentification, compte, commandes, points relais, paiement, notifications). Indépendante du thème.
 * Version:           0.2.1
 * Requires at least: 6.5
 * Requires PHP:      8.1
 * Author:            Épicerie Fine MiniarDise
 * License:           GPL-2.0-or-later
 * Text Domain:       miniardise-mobile
 * WC requires at least: 9.0
 * WC tested up to:   11.3
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

define( 'MM_VERSION', '0.2.1' );
define( 'MM_DB_VERSION', '1' );
define( 'MM_FILE', __FILE__ );

// Chargement PSR-4 sans dépendance Composer en production.
spl_autoload_register(
	static function ( string $class ): void {
		$prefix = 'MiniarDise\\Mobile\\';
		if ( ! str_starts_with( $class, $prefix ) ) {
			return;
		}
		$file = __DIR__ . '/src/' . str_replace( '\\', '/', substr( $class, strlen( $prefix ) ) ) . '.php';
		if ( is_readable( $file ) ) {
			require $file;
		}
	}
);

register_activation_hook( __FILE__, array( \MiniarDise\Mobile\Install\Schema::class, 'install' ) );

// Compatible stockage des commandes HPOS : l'extension n'utilise que les fonctions CRUD WooCommerce.
add_action(
	'before_woocommerce_init',
	static function (): void {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}
);

add_action( 'plugins_loaded', array( \MiniarDise\Mobile\Plugin::class, 'boot' ) );
