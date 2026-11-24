<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Rest;

use MiniarDise\Mobile\Auth\BearerAuthenticator;
use MiniarDise\Mobile\Auth\RefreshResult;
use MiniarDise\Mobile\Auth\TokenService;
use MiniarDise\Mobile\Security\ClientIp;
use MiniarDise\Mobile\Security\RateLimiter;
use MiniarDise\Mobile\Security\SecurityLog;

/**
 * POST /auth/login, /auth/refresh, /auth/logout (Phase 3).
 * Inscription, mot de passe oublié et suppression de compte : Phase 4b.
 */
final class AuthController {
	private const NS = 'miniardise-mobile/v1';

	/** Rôles qui n'obtiennent jamais de jeton d'app : un vol de téléphone ne doit pas exposer l'administration. */
	private const PRIVILEGED_CAPS = array( 'manage_options', 'manage_woocommerce', 'edit_posts', 'edit_shop_orders' );

	public function __construct(
		private readonly TokenService $tokens,
		private readonly RateLimiter $limiter,
		private readonly SecurityLog $log,
	) {}

	public function register(): void {
		register_rest_route(
			self::NS,
			'/auth/login',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'login' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'email'    => array( 'type' => 'string', 'required' => true, 'format' => 'email', 'maxLength' => 254 ),
					'password' => array( 'type' => 'string', 'required' => true, 'minLength' => 1, 'maxLength' => 256 ),
					'device'   => array( 'type' => 'string', 'required' => false, 'maxLength' => 100 ),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/auth/refresh',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'refresh' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'refresh_token' => array( 'type' => 'string', 'required' => true, 'pattern' => '^[a-f0-9]{64}$' ),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/auth/logout',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'logout' ),
				'permission_callback' => static fn() => is_user_logged_in(),
				'args'                => array( 'all' => array( 'type' => 'boolean', 'default' => false ) ),
			)
		);
	}

	/** @return \WP_REST_Response|\WP_Error */
	public function login( \WP_REST_Request $req ) {
		$ip    = ClientIp::from( $_SERVER );
		$email = strtolower( trim( (string) $req->get_param( 'email' ) ) );

		foreach ( array( array( 'login_ip', $ip, 10 ), array( 'login_email', $email, 5 ) ) as [ $scope, $key, $limit ] ) {
			$r = $this->limiter->attempt( $scope, $key, $limit, 900 );
			if ( ! $r['allowed'] ) {
				$this->log->record( SecurityLog::RATE_LIMITED, null, $ip, $scope );
				return Responses::error( 'mm_rate_limited', 'Trop de tentatives. Réessayez plus tard.', 429, $r['retry_after'] );
			}
		}

		$user = wp_authenticate( $email, (string) $req->get_param( 'password' ) );
		if ( is_wp_error( $user ) || ! self::isCustomerAccount( $user ) ) {
			$this->log->record( SecurityLog::LOGIN_FAILED, null, $ip );
			// Même réponse que le compte existe ou non (anti-énumération).
			return Responses::error( 'mm_invalid_credentials', 'Identifiants incorrects.', 401 );
		}

		$pair = $this->tokens->issue( $user->ID, (string) $req->get_param( 'device' ) );
		$this->log->record( SecurityLog::LOGIN_OK, $user->ID, $ip );
		return Responses::ok( array( 'tokens' => $pair->toArray(), 'user' => self::publicUser( $user ) ) );
	}

	/** @return \WP_REST_Response|\WP_Error */
	public function refresh( \WP_REST_Request $req ) {
		$ip = ClientIp::from( $_SERVER );
		$r  = $this->limiter->attempt( 'refresh_ip', $ip, 30, 900 );
		if ( ! $r['allowed'] ) {
			return Responses::error( 'mm_rate_limited', 'Trop de tentatives. Réessayez plus tard.', 429, $r['retry_after'] );
		}

		[ $result, $pair, $userId ] = $this->tokens->refresh( (string) $req->get_param( 'refresh_token' ) );
		if ( RefreshResult::Reused === $result ) {
			$this->log->record( SecurityLog::REFRESH_REUSED, $userId, $ip );
		}
		if ( RefreshResult::Ok !== $result || null === $pair ) {
			return Responses::error( 'mm_session_expired', 'Session expirée. Merci de vous reconnecter.', 401 );
		}
		return Responses::ok( array( 'tokens' => $pair->toArray() ) );
	}

	public function logout( \WP_REST_Request $req ): \WP_REST_Response {
		$userId = get_current_user_id();
		if ( true === $req->get_param( 'all' ) ) {
			$this->tokens->revokeUser( $userId );
			$this->log->record( SecurityLog::REVOKED_ALL, $userId, ClientIp::from( $_SERVER ) );
		} else {
			$token = BearerAuthenticator::bearerToken( $_SERVER );
			if ( null !== $token ) {
				$this->tokens->revokeByAccessToken( $token );
			}
			$this->log->record( SecurityLog::LOGOUT, $userId, ClientIp::from( $_SERVER ) );
		}
		return Responses::ok( array( 'ok' => true ) );
	}

	private static function isCustomerAccount( \WP_User $user ): bool {
		foreach ( self::PRIVILEGED_CAPS as $cap ) {
			if ( user_can( $user, $cap ) ) {
				return false;
			}
		}
		return true;
	}

	/** @return array<string, int|string> */
	private static function publicUser( \WP_User $user ): array {
		return array(
			'id'         => $user->ID,
			'email'      => $user->user_email,
			'first_name' => (string) get_user_meta( $user->ID, 'first_name', true ),
			'last_name'  => (string) get_user_meta( $user->ID, 'last_name', true ),
		);
	}
}
