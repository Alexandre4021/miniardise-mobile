<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Rest;

/**
 * GET /miniardise-mobile/v1/home — contenu éditorial de l'accueil de l'app.
 * Carrousel : repris tel quel de l'extension « MiniarDise Carrousel » (options mocar_*),
 * pour qu'une seule saisie alimente le site et l'app. Vide si l'extension est absente.
 */
final class HomeController {
	public function register(): void {
		register_rest_route(
			'miniardise-mobile/v1',
			'/home',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	public function get(): \WP_REST_Response {
		$r = new \WP_REST_Response( array( 'carousel' => self::carousel() ) );
		$r->header( 'Cache-Control', 'public, max-age=300' );
		return $r;
	}

	/** @return array<string, mixed> */
	private static function carousel(): array {
		if ( ! function_exists( 'mocar_get_slides' ) || ! function_exists( 'mocar_get_settings' ) ) {
			return array( 'slides' => array(), 'settings' => null );
		}
		$settings = mocar_get_settings();
		$raw      = mocar_get_slides();
		$slides   = array();
		foreach ( $raw as $s ) {
			$img = wp_get_attachment_image_src( (int) $s['id'], 'large' );
			if ( ! is_array( $img ) ) {
				continue;
			}
			$alt      = '' !== $s['alt'] ? $s['alt'] : (string) get_post_meta( (int) $s['id'], '_wp_attachment_image_alt', true );
			$slides[] = self::slide( (int) $s['id'], (string) $img[0], (int) $img[1], (int) $img[2], $alt, (string) $s['badge'], (string) $s['link'], (string) $s['fit'], (string) $settings['fit'] );
		}
		$frame = function_exists( 'mocar_frame_ratio' ) ? (float) mocar_frame_ratio( $raw, $settings ) : 1.5;
		return array(
			'slides'   => $slides,
			'settings' => array(
				'autoplay'    => (bool) $settings['autoplay'],
				'speed_ms'    => max( 2, min( 20, (int) $settings['speed'] ) ) * 1000,
				'frame_ratio' => round( $frame, 4 ),
				'background'  => (string) $settings['bg'],
			),
		);
	}

	/**
	 * Une diapositive normalisée. Lien : seulement http(s), sinon vide (l'app ouvre alors la boutique).
	 *
	 * @return array<string, int|string>
	 */
	public static function slide( int $id, string $url, int $w, int $h, string $alt, string $badge, string $link, string $fit, string $defaultFit ): array {
		$link = 1 === preg_match( '#^https?://#i', $link ) ? $link : '';
		$fit  = '' !== $fit ? $fit : $defaultFit;
		return array(
			'id'     => $id,
			'image'  => $url,
			'width'  => $w,
			'height' => $h,
			'alt'    => mb_substr( $alt, 0, 200 ),
			'badge'  => mb_substr( $badge, 0, 40 ),
			'link'   => $link,
			'fit'    => 'cover' === $fit ? 'cover' : 'contain',
		);
	}
}
