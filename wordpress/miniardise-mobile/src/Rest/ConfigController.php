<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Rest;

/**
 * GET /miniardise-mobile/v1/config — réglages publics lus par l'app au démarrage.
 */
final class ConfigController {
	public function register(): void {
		register_rest_route(
			'miniardise-mobile/v1',
			'/config',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	public function get(): \WP_REST_Response {
		$terms = function_exists( 'wc_terms_and_conditions_page_id' ) ? (int) wc_terms_and_conditions_page_id() : 0;
		$r     = new \WP_REST_Response(
			array(
				'api_version'        => 1,
				'plugin_version'     => MM_VERSION,
				'min_app_version'    => (string) get_option( 'mm_min_app_version', '0.1.0' ),
				'maintenance'        => (bool) get_option( 'mm_maintenance', false ),
				'privacy_policy_url' => get_privacy_policy_url(),
				'terms_url'          => $terms > 0 ? (string) get_permalink( $terms ) : '',
				'currency'           => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'EUR',
			)
		);
		$r->header( 'Cache-Control', 'public, max-age=300' );
		return $r;
	}
}
