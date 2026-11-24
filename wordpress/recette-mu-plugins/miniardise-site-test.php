<?php
/**
 * Plugin Name: MiniarDise — garde du site de test
 * Description: Cloisonne le site de test (recette) : accès réservé, aucun e-mail envoyé aux clients, aucun webhook, aucun paiement réel, non indexé, bandeau « SITE DE TEST ».
 * Version: 1.2.0
 *
 * Ce fichier ne s'active QUE sur l'adresse recette.epiceriefineminiardise.fr avec
 * WP_ENVIRONMENT_TYPE = staging. Déposé par erreur sur le site en ligne, il ne fait rien.
 *
 * @package MiniarDise
 */

defined( 'ABSPATH' ) || exit;

const MO_TEST_HOTE    = 'recette.epiceriefineminiardise.fr';
const MO_TEST_COOKIE  = 'mo_recette_acces';

/** Le site courant est-il bien le site de test ? */
function mo_test_actif(): bool {
	$host = strtolower( (string) wp_parse_url( defined( 'WP_HOME' ) ? WP_HOME : get_option( 'home' ), PHP_URL_HOST ) );
	return MO_TEST_HOTE === $host && 'staging' === wp_get_environment_type();
}

if ( ! mo_test_actif() ) {
	return;
}

/* -------------------------------------------------------------------------
 * 1. Accès réservé : code d'accès (une fois par navigateur) ou compte administrateur connecté.
 *    Lien d'accès : https://recette.epiceriefineminiardise.fr/?acces=CODE
 * ---------------------------------------------------------------------- */
function mo_test_jeton(): string {
	return defined( 'MO_TEST_CODE_ACCES' ) && MO_TEST_CODE_ACCES ? hash( 'sha256', 'mo-recette|' . MO_TEST_CODE_ACCES ) : '';
}

/** Accès de l'application mobile de test : en-tête + code dédié, routes de l'app uniquement. */
function mo_test_acces_app(): bool {
	if ( ! defined( 'MO_TEST_CODE_APP' ) || ! MO_TEST_CODE_APP || empty( $_SERVER['HTTP_X_MO_RECETTE_ACCES'] ) ) {
		return false;
	}
	$code = (string) $_SERVER['HTTP_X_MO_RECETTE_ACCES']; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	if ( ! hash_equals( hash( 'sha256', 'mo-app|' . MO_TEST_CODE_APP ), hash( 'sha256', 'mo-app|' . $code ) ) ) {
		return false;
	}
	$path = (string) wp_parse_url( (string) ( $_SERVER['REQUEST_URI'] ?? '' ), PHP_URL_PATH ); // phpcs:ignore
	return 1 === preg_match( '#^/wp-json/(wc/store/|miniardise-mobile/v1/)#', $path );
}

add_action(
	'init',
	function () {
		if ( ( defined( 'WP_CLI' ) && WP_CLI ) || wp_doing_cron() ) {
			return;
		}
		$jeton = mo_test_jeton();
		$code  = isset( $_GET['acces'] ) ? sanitize_text_field( wp_unslash( $_GET['acces'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( $jeton && $code && hash_equals( $jeton, hash( 'sha256', 'mo-recette|' . $code ) ) ) {
			setcookie( MO_TEST_COOKIE, $jeton, array( 'expires' => time() + 30 * DAY_IN_SECONDS, 'path' => '/', 'secure' => is_ssl(), 'httponly' => true, 'samesite' => 'Lax' ) );
			wp_safe_redirect( remove_query_arg( 'acces' ) );
			exit;
		}
		$ok = $jeton && isset( $_COOKIE[ MO_TEST_COOKIE ] ) && hash_equals( $jeton, (string) $_COOKIE[ MO_TEST_COOKIE ] );
		// v1.2.0 — Application mobile (builds de développement / recette) : en-tête X-MO-Recette-Acces,
		// accepté UNIQUEMENT sur les API de l'app (Store API + miniardise-mobile), avec un code
		// distinct du code navigateur (MO_TEST_CODE_APP dans wp-config.php de la recette).
		if ( ! $ok && mo_test_acces_app() ) {
			return;
		}
		// Correctif A01-001 / A07-002 : un compte connecté ne suffit plus, il faut être administrateur ou gérant de boutique.
		if ( $ok || current_user_can( 'manage_woocommerce' ) ) {
			return;
		}
		// Page de connexion et réinitialisation du mot de passe : autorisées (WordPress protège déjà).
		$page = basename( strtok( (string) ( $_SERVER['REQUEST_URI'] ?? '' ), '?' ) );
		if ( in_array( $page, array( 'wp-login.php' ), true ) || is_admin() && ! wp_doing_ajax() ) {
			return;
		}
		status_header( 403 );
		nocache_headers();
		header( 'X-Robots-Tag: noindex, nofollow', true );
		header( 'Content-Type: text/html; charset=utf-8' );
		echo '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site de test</title>'
			. '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fbf8f1;color:#1e1a12;font:16px/1.6 system-ui,sans-serif">'
			. '<div style="max-width:420px;padding:28px;text-align:center"><h1 style="font-family:Georgia,serif;color:#84601a">Site de test</h1>'
			. '<p>Ce site est réservé aux essais de l\'Épicerie Fine MiniarDise.</p>'
			. '<p><a style="color:#84601a" href="https://epiceriefineminiardise.fr/">Aller sur la boutique</a> · <a style="color:#84601a" href="' . esc_url( wp_login_url() ) . '">Connexion</a></p></div></body></html>';
		exit;
	},
	0
);

/* -------------------------------------------------------------------------
 * 2. Aucun e-mail vers les clients.
 *    Par défaut : aucun envoi. Si MO_TEST_MAIL_VERS est défini (wp-config.php),
 *    tous les e-mails partent vers cette seule adresse, préfixés [TEST].
 * ---------------------------------------------------------------------- */
add_filter(
	'pre_wp_mail',
	function ( $retour, array $atts ) {
		if ( defined( 'MO_TEST_MAIL_VERS' ) && is_email( MO_TEST_MAIL_VERS ) ) {
			return null; // l'envoi continue, destinataire réécrit ci-dessous
		}
		$log = WP_CONTENT_DIR . '/mo-test-emails-bloques.log';
		$to  = is_array( $atts['to'] ) ? implode( ', ', $atts['to'] ) : (string) $atts['to'];
		@file_put_contents( $log, gmdate( 'c' ) . "\t" . $to . "\t" . wp_strip_all_tags( (string) $atts['subject'] ) . "\n", FILE_APPEND ); // phpcs:ignore
		return true; // considéré comme « envoyé » : rien ne part
	},
	1,
	2
);
add_filter(
	'wp_mail',
	function ( array $atts ): array {
		if ( defined( 'MO_TEST_MAIL_VERS' ) && is_email( MO_TEST_MAIL_VERS ) ) {
			$atts['to']      = MO_TEST_MAIL_VERS;
			$atts['subject'] = '[TEST] ' . $atts['subject'];
			$headers         = is_array( $atts['headers'] ) ? $atts['headers'] : explode( "\n", (string) $atts['headers'] );
			$atts['headers'] = array_values( array_filter( $headers, fn( $h ) => ! preg_match( '/^\s*(cc|bcc)\s*:/i', (string) $h ) ) );
		}
		return $atts;
	},
	PHP_INT_MAX
);

/* -------------------------------------------------------------------------
 * 3. Aucun échange avec les services de la boutique réelle.
 * ---------------------------------------------------------------------- */
add_filter( 'woocommerce_webhook_should_deliver', '__return_false', PHP_INT_MAX );
add_filter(
	'pre_http_request',
	function ( $pre, $args, $url ) {
		$host = (string) wp_parse_url( $url, PHP_URL_HOST );
		// v1.2.0 — WooPayments en compte de TEST (sandbox) sur la recette : définir MO_TEST_WOOPAYMENTS_SANDBOX
		// dans wp-config.php APRÈS avoir connecté la recette à un compte WooPayments de test. Sinon Stripe reste bloqué.
		if ( defined( 'MO_TEST_WOOPAYMENTS_SANDBOX' ) && MO_TEST_WOOPAYMENTS_SANDBOX && preg_match( '/(^|\.)(api\.stripe\.com|public-api\.wordpress\.com)$/i', $host ) ) {
			return $pre;
		}
		if ( preg_match( '/(^|\.)(m2e\.cloud|m2epro\.com|facebook\.com|facebook\.net|google-analytics\.com|googletagmanager\.com|merchant-center|content-shopping\.googleapis\.com|public-api\.wordpress\.com|api\.stripe\.com)$/i', $host ) ) {
			return new WP_Error( 'mo_site_test', 'Appel externe bloqué sur le site de test : ' . $host );
		}
		return $pre;
	},
	10,
	3
);

/* -------------------------------------------------------------------------
 * 4. Paiement : seuls les moyens sans débit réel sont proposés
 *    (virement, chèque = « Paiement de test »). Axepta peut être ajouté
 *    en mode test en définissant MO_TEST_PASSERELLES dans wp-config.php.
 * ---------------------------------------------------------------------- */
add_filter(
	'woocommerce_available_payment_gateways',
	function ( $gateways ) {
		$autorisees = array( 'bacs', 'cheque', 'cod' );
		if ( defined( 'MO_TEST_PASSERELLES' ) ) {
			$autorisees = array_merge( $autorisees, array_map( 'trim', explode( ',', MO_TEST_PASSERELLES ) ) );
		}
		return is_array( $gateways ) ? array_intersect_key( $gateways, array_flip( $autorisees ) ) : $gateways;
	},
	PHP_INT_MAX
);

/* -------------------------------------------------------------------------
 * 5. Jamais indexé.
 * ---------------------------------------------------------------------- */
add_filter( 'pre_option_blog_public', fn() => '0' );
add_filter( 'wp_robots', fn( $r ) => array_merge( $r, array( 'noindex' => true, 'nofollow' => true ) ), PHP_INT_MAX );
add_action( 'send_headers', fn() => header( 'X-Robots-Tag: noindex, nofollow', true ) );
add_filter( 'robots_txt', fn() => "User-agent: *\nDisallow: /\n", PHP_INT_MAX );

/* -------------------------------------------------------------------------
 * 6. Images : si le dossier uploads n'a pas été copié, on les affiche depuis le site en ligne.
 * ---------------------------------------------------------------------- */
if ( defined( 'MO_TEST_IMAGES_DEPUIS_PROD' ) && MO_TEST_IMAGES_DEPUIS_PROD ) {
	add_filter(
		'upload_dir',
		function ( array $d ): array {
			$d['baseurl'] = 'https://epiceriefineminiardise.fr/wp-content/uploads';
			$d['url']     = $d['baseurl'] . $d['subdir'];
			return $d;
		}
	);
}

/* -------------------------------------------------------------------------
 * 7. Bandeau « SITE DE TEST » bien visible (site et administration).
 * ---------------------------------------------------------------------- */
function mo_test_bandeau(): void {
	echo '<div style="position:sticky;top:0;z-index:99999;background:#a8261d;color:#fff;text-align:center;font:600 13px/1.4 system-ui,sans-serif;padding:6px 12px;letter-spacing:.04em">'
		. 'SITE DE TEST — aucun paiement réel, aucun e-mail envoyé</div>';
}
add_action( 'wp_body_open', 'mo_test_bandeau', 0 );
add_action( 'in_admin_header', 'mo_test_bandeau', 0 );
add_filter( 'document_title_parts', function ( $t ) { $t['title'] = '[TEST] ' . ( $t['title'] ?? '' ); return $t; } );
