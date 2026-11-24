<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Staging;

/**
 * RECETTE UNIQUEMENT (WP_ENVIRONMENT_TYPE = staging + garde « miniardise-site-test » présente).
 *
 * La garde de la recette exige un cookie d'accès que l'app native n'a pas. Si la requête vise
 * une API de l'app ET porte l'en-tête X-MO-Recette-Acces avec le bon code, on présente à la garde
 * son propre jeton d'accès pour CETTE requête. Le code se règle dans Réglages › MiniarDise Mobile
 * (stocké haché) ou par la constante MO_TEST_CODE_APP. Sans effet en production.
 */
final class RecetteAppAccess {
	public const OPTION = 'mm_recette_app_code_hash';
	public const HEADER = 'HTTP_X_MO_RECETTE_ACCES';

	public function register(): void {
		if ( 'staging' !== wp_get_environment_type() ) {
			return;
		}
		add_action( 'init', array( $this, 'maybeGrant' ), -100 ); // avant la garde (priorité 0)
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_post_mm_save_recette_code', array( $this, 'save' ) );
	}

	/** Chemin d'URL d'une API de l'app ? */
	public static function isAppApiPath( string $path ): bool {
		return 1 === preg_match( '#^/wp-json/(wc/store/|miniardise-mobile/v1/)#', $path );
	}

	public static function hashCode( string $code, string $salt ): string {
		return hash_hmac( 'sha256', $code, $salt );
	}

	/** Le code présenté correspond-il au code enregistré (haché) ou à la constante ? */
	public static function codeMatches( string $presented, string $storedHash, ?string $constant, string $salt ): bool {
		if ( '' === $presented || strlen( $presented ) > 200 ) {
			return false;
		}
		if ( '' !== $storedHash && hash_equals( $storedHash, self::hashCode( $presented, $salt ) ) ) {
			return true;
		}
		return null !== $constant && '' !== $constant && hash_equals( self::hashCode( $constant, $salt ), self::hashCode( $presented, $salt ) );
	}

	public function maybeGrant(): void {
		if ( empty( $_SERVER[ self::HEADER ] ) || ! function_exists( 'mo_test_jeton' ) || ! defined( 'MO_TEST_COOKIE' ) ) {
			return;
		}
		$path = (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? (string) $_SERVER['REQUEST_URI'] : '', PHP_URL_PATH );
		if ( ! self::isAppApiPath( $path ) ) {
			return;
		}
		$presented = trim( (string) $_SERVER[ self::HEADER ] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$constant  = defined( 'MO_TEST_CODE_APP' ) ? (string) MO_TEST_CODE_APP : null;
		if ( ! self::codeMatches( $presented, (string) get_option( self::OPTION, '' ), $constant, wp_salt( 'auth' ) ) ) {
			return;
		}
		$jeton = (string) \mo_test_jeton();
		if ( '' !== $jeton ) {
			$_COOKIE[ \MO_TEST_COOKIE ] = $jeton; // pour cette requête uniquement, aucun cookie n'est envoyé au client
		}
	}

	public function menu(): void {
		add_options_page( 'MiniarDise Mobile', 'MiniarDise Mobile', 'manage_options', 'miniardise-mobile', array( $this, 'page' ) );
	}

	public function page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$configured = '' !== (string) get_option( self::OPTION, '' ) || defined( 'MO_TEST_CODE_APP' );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$saved = isset( $_GET['mm_saved'] );
		echo '<div class="wrap"><h1>MiniarDise Mobile — recette</h1>';
		if ( $saved ) {
			echo '<div class="notice notice-success"><p>Code enregistré.</p></div>';
		}
		echo '<p>Version de l\'extension : <strong>' . esc_html( MM_VERSION ) . '</strong></p>';
		echo '<p>Code d\'accès de l\'application à la recette : <strong>' . ( $configured ? 'configuré' : 'non configuré' ) . '</strong></p>';
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		wp_nonce_field( 'mm_save_recette_code' );
		echo '<input type="hidden" name="action" value="mm_save_recette_code">';
		echo '<p><label for="mm_code">Nouveau code (identique à <code>EXPO_PUBLIC_RECETTE_ACCESS</code> de l\'app) :</label><br>';
		echo '<input type="password" id="mm_code" name="mm_code" class="regular-text" autocomplete="new-password" minlength="12" maxlength="200" required></p>';
		submit_button( 'Enregistrer le code' );
		echo '</form><p class="description">Le code est stocké sous forme hachée. Cette page n\'existe que sur la recette.</p></div>';
	}

	public function save(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Accès refusé.', 403 );
		}
		check_admin_referer( 'mm_save_recette_code' );
		$code = isset( $_POST['mm_code'] ) ? trim( (string) wp_unslash( $_POST['mm_code'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		if ( strlen( $code ) >= 12 && strlen( $code ) <= 200 ) {
			update_option( self::OPTION, self::hashCode( $code, wp_salt( 'auth' ) ), false );
		}
		wp_safe_redirect( admin_url( 'options-general.php?page=miniardise-mobile&mm_saved=1' ) );
		exit;
	}
}
