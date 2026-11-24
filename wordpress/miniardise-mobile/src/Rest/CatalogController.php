<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Rest;

use MiniarDise\Mobile\Catalog\ProductSheet;
use MiniarDise\Mobile\Catalog\Reviews;
use MiniarDise\Mobile\Support\Money;

/**
 * GET /products/{id}/details — fiche complète comme sur le site (thème MiniarDise Or),
 *                              poids et prix par déclinaison, avis.
 * GET /reviews/latest        — derniers avis (bloc d'accueil, comme le site).
 */
final class CatalogController {
	private const NS = 'miniardise-mobile/v1';

	public function register(): void {
		register_rest_route(
			self::NS,
			'/products/(?P<id>\d+)/details',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'details' ),
				'permission_callback' => '__return_true',
				'args'                => array( 'id' => array( 'type' => 'integer', 'minimum' => 1, 'required' => true ) ),
			)
		);
		register_rest_route(
			self::NS,
			'/reviews/latest',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'latest' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/** @return \WP_REST_Response|\WP_Error */
	public function details( \WP_REST_Request $req ) {
		$product = wc_get_product( (int) $req['id'] );
		if ( ! $product || 'publish' !== $product->get_status() || $product->is_type( 'variation' ) ) {
			return Responses::error( 'mm_not_found', 'Produit introuvable.', 404 );
		}

		$variations = self::variations( $product );
		$sheet      = null;
		if ( function_exists( 'mo_sheet_get' ) && function_exists( 'mo_nutri_cell' ) ) {
			$sheet = ProductSheet::normalize(
				(array) mo_sheet_get( $product ),
				array_column( $variations, 'label' ),
				static fn( array $n, string $key, float $ratio ): string => wp_strip_all_tags( (string) mo_nutri_cell( $n, $key, $ratio ) ),
				(string) $product->get_description()
			);
		}

		$r = new \WP_REST_Response(
			array(
				'id'         => $product->get_id(),
				'sheet'      => $sheet,
				'variations' => $variations,
				'reviews'    => Reviews::forProduct( $product->get_id() ),
			)
		);
		$r->header( 'Cache-Control', 'public, max-age=120' );
		return $r;
	}

	public function latest(): \WP_REST_Response {
		$r = new \WP_REST_Response( Reviews::latest() );
		$r->header( 'Cache-Control', 'public, max-age=300' );
		return $r;
	}

	/**
	 * Déclinaisons achetables triées par poids : libellé, prix TTC (centimes), stock, quantité max.
	 *
	 * @return list<array<string, mixed>>
	 */
	public static function variations( \WC_Product $product ): array {
		if ( function_exists( 'mo_card_variations' ) ) {
			$out = array();
			foreach ( (array) mo_card_variations( $product ) as $v ) {
				$out[] = array(
					'id'       => (int) $v['id'],
					'label'    => (string) $v['label'],
					'price'    => Money::toMinor( (float) $v['price_raw'] ),
					'in_stock' => (bool) $v['in_stock'],
					'max'      => '' === $v['max'] ? null : (int) $v['max'],
				);
			}
			return $out;
		}
		if ( ! $product->is_type( 'variable' ) ) {
			return array();
		}
		$out = array();
		foreach ( $product->get_children() as $childId ) {
			$v = wc_get_product( $childId );
			if ( ! $v || 'publish' !== $v->get_status() || '' === $v->get_price() ) {
				continue;
			}
			$max   = $v->get_max_purchase_quantity();
			$out[] = array(
				'id'       => $v->get_id(),
				'label'    => wc_get_formatted_variation( $v, true, false, false ),
				'price'    => Money::toMinor( (float) wc_get_price_to_display( $v ) ),
				'in_stock' => $v->is_in_stock() && $v->is_purchasable(),
				'max'      => $max > 0 ? $max : null,
			);
		}
		return $out;
	}
}
