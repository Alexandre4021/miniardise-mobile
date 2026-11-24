<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Catalog;

use MiniarDise\Mobile\Rest\CatalogController;

/**
 * Ajoute aux produits de la Store API (liste et fiche) les poids, prix TTC et stocks de chaque
 * déclinaison, sous extensions["miniardise-mobile"]. Mécanisme officiel d'extension de WooCommerce :
 * la boutique de l'app charge ses cartes « poids + quantité + ajout au panier » en une requête.
 */
final class StoreApiExtension {
	public const NS = 'miniardise-mobile';

	public static function register(): void {
		if ( did_action( 'woocommerce_blocks_loaded' ) ) {
			self::registerData();
		} else {
			add_action( 'woocommerce_blocks_loaded', array( self::class, 'registerData' ) );
		}
	}

	public static function registerData(): void {
		if ( ! function_exists( 'woocommerce_store_api_register_endpoint_data' ) || ! class_exists( \Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema::class ) ) {
			return;
		}
		woocommerce_store_api_register_endpoint_data(
			array(
				'endpoint'        => \Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema::IDENTIFIER,
				'namespace'       => self::NS,
				'data_callback'   => static function ( $product ): array {
					return array( 'variations' => $product instanceof \WC_Product ? CatalogController::variations( $product ) : array() );
				},
				'schema_callback' => static function (): array {
					return array(
						'variations' => array(
							'description' => 'Déclinaisons achetables : poids, prix TTC en centimes, stock.',
							'type'        => 'array',
							'context'     => array( 'view', 'edit' ),
							'readonly'    => true,
						),
					);
				},
				'schema_type'     => ARRAY_A,
			)
		);
	}
}
