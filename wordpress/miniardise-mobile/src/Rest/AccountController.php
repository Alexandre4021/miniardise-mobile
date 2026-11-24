<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Rest;

use MiniarDise\Mobile\Account\OrderPresenter;
use MiniarDise\Mobile\Auth\TokenService;
use MiniarDise\Mobile\Security\ClientIp;
use MiniarDise\Mobile\Security\RateLimiter;
use MiniarDise\Mobile\Security\SecurityLog;

/**
 * Compte client : inscription, mot de passe oublié, profil, adresses, commandes.
 * Toutes les données viennent du compte WooCommerce (WC_Customer, wc_get_orders).
 */
final class AccountController {
	private const NS = 'miniardise-mobile/v1';

	public const ADDRESS_FIELDS = array( 'first_name', 'last_name', 'company', 'address_1', 'address_2', 'postcode', 'city', 'country', 'phone' );

	public function __construct(
		private readonly TokenService $tokens,
		private readonly RateLimiter $limiter,
		private readonly SecurityLog $log,
	) {}

	public function register(): void {
		$auth = static fn() => is_user_logged_in();

		register_rest_route(
			self::NS,
			'/auth/register',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'signup' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'email'      => array( 'type' => 'string', 'format' => 'email', 'required' => true, 'maxLength' => 254 ),
					'password'   => array( 'type' => 'string', 'required' => true, 'minLength' => 10, 'maxLength' => 256 ),
					'first_name' => array( 'type' => 'string', 'required' => true, 'minLength' => 1, 'maxLength' => 80 ),
					'last_name'  => array( 'type' => 'string', 'required' => true, 'minLength' => 1, 'maxLength' => 80 ),
					'device'     => array( 'type' => 'string', 'maxLength' => 100 ),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/auth/password-reset',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'passwordReset' ),
				'permission_callback' => '__return_true',
				'args'                => array( 'login' => array( 'type' => 'string', 'required' => true, 'minLength' => 1, 'maxLength' => 254 ) ),
			)
		);
		register_rest_route(
			self::NS,
			'/me',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'me' ),
					'permission_callback' => $auth,
				),
				array(
					'methods'             => 'PATCH',
					'callback'            => array( $this, 'updateMe' ),
					'permission_callback' => $auth,
					'args'                => array(
						'first_name' => array( 'type' => 'string', 'minLength' => 1, 'maxLength' => 80 ),
						'last_name'  => array( 'type' => 'string', 'minLength' => 1, 'maxLength' => 80 ),
						'phone'      => array( 'type' => 'string', 'maxLength' => 30 ),
					),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/me/addresses',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'addresses' ),
					'permission_callback' => $auth,
				),
				array(
					'methods'             => 'PUT',
					'callback'            => array( $this, 'updateAddresses' ),
					'permission_callback' => $auth,
				),
			)
		);
		register_rest_route(
			self::NS,
			'/me/orders',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'orders' ),
				'permission_callback' => $auth,
				'args'                => array( 'page' => array( 'type' => 'integer', 'minimum' => 1, 'default' => 1 ) ),
			)
		);
		register_rest_route(
			self::NS,
			'/me/orders/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'order' ),
				'permission_callback' => $auth,
				'args'                => array( 'id' => array( 'type' => 'integer', 'minimum' => 1, 'required' => true ) ),
			)
		);
	}

	/** @return \WP_REST_Response|\WP_Error */
	public function signup( \WP_REST_Request $req ) {
		$ip = ClientIp::from( $_SERVER );
		$r  = $this->limiter->attempt( 'register_ip', $ip, 5, 3600 );
		if ( ! $r['allowed'] ) {
			$this->log->record( SecurityLog::RATE_LIMITED, null, $ip, 'register' );
			return Responses::error( 'mm_rate_limited', 'Trop de tentatives. Réessayez plus tard.', 429, $r['retry_after'] );
		}
		if ( 'yes' !== get_option( 'woocommerce_enable_myaccount_registration' ) ) {
			return Responses::error( 'mm_registration_closed', 'La création de compte est momentanément fermée.', 403 );
		}
		$email = sanitize_email( (string) $req['email'] );
		$id    = wc_create_new_customer(
			$email,
			'',
			(string) $req['password'],
			array(
				'first_name' => sanitize_text_field( (string) $req['first_name'] ),
				'last_name'  => sanitize_text_field( (string) $req['last_name'] ),
			)
		);
		if ( is_wp_error( $id ) ) {
			// Message unique, que l'adresse existe déjà ou non.
			return Responses::error( 'mm_registration_failed', 'Impossible de créer ce compte. Si vous en avez déjà un, connectez-vous ou réinitialisez votre mot de passe.', 400 );
		}
		$user = get_user_by( 'id', (int) $id );
		$pair = $this->tokens->issue( (int) $id, (string) $req->get_param( 'device' ) );
		$this->log->record( 'register_ok', (int) $id, $ip );
		return Responses::ok( array( 'tokens' => $pair->toArray(), 'user' => self::profile( $user instanceof \WP_User ? $user : null ) ), 201 );
	}

	public function passwordReset( \WP_REST_Request $req ): \WP_REST_Response {
		$ip = ClientIp::from( $_SERVER );
		$r  = $this->limiter->attempt( 'reset_ip', $ip, 5, 3600 );
		if ( $r['allowed'] ) {
			retrieve_password( sanitize_text_field( (string) $req['login'] ) ); // e-mail WordPress standard
		}
		// Toujours la même réponse : on ne révèle pas si le compte existe.
		return Responses::ok( array( 'message' => 'Si un compte correspond, un e-mail de réinitialisation vient d’être envoyé.' ) );
	}

	public function me(): \WP_REST_Response {
		return Responses::ok( self::profile( wp_get_current_user() ) );
	}

	public function updateMe( \WP_REST_Request $req ): \WP_REST_Response {
		$customer = new \WC_Customer( get_current_user_id() );
		if ( null !== $req->get_param( 'first_name' ) ) {
			$customer->set_first_name( sanitize_text_field( (string) $req['first_name'] ) );
		}
		if ( null !== $req->get_param( 'last_name' ) ) {
			$customer->set_last_name( sanitize_text_field( (string) $req['last_name'] ) );
		}
		if ( null !== $req->get_param( 'phone' ) ) {
			$customer->set_billing_phone( wc_sanitize_phone_number( (string) $req['phone'] ) );
		}
		$customer->save();
		return Responses::ok( self::profile( wp_get_current_user() ) );
	}

	public function addresses(): \WP_REST_Response {
		return Responses::ok( self::addressPayload( new \WC_Customer( get_current_user_id() ) ) );
	}

	/** @return \WP_REST_Response|\WP_Error */
	public function updateAddresses( \WP_REST_Request $req ) {
		$customer = new \WC_Customer( get_current_user_id() );
		foreach ( array( 'billing', 'shipping' ) as $type ) {
			$in = $req->get_param( $type );
			if ( ! is_array( $in ) ) {
				continue;
			}
			$clean = self::sanitizeAddress( $in );
			if ( isset( $clean['error'] ) ) {
				return Responses::error( 'mm_invalid_address', (string) $clean['error'], 400 );
			}
			foreach ( $clean as $field => $value ) {
				if ( 'phone' === $field && 'shipping' === $type && ! method_exists( $customer, 'set_shipping_phone' ) ) {
					continue;
				}
				$customer->{"set_{$type}_{$field}"}( $value );
			}
		}
		$customer->save();
		return Responses::ok( self::addressPayload( $customer ) );
	}

	public function orders( \WP_REST_Request $req ): \WP_REST_Response {
		$page   = max( 1, (int) $req['page'] );
		$result = wc_get_orders(
			array(
				'customer_id' => get_current_user_id(),
				'limit'       => 10,
				'paged'       => $page,
				'orderby'     => 'date',
				'order'       => 'DESC',
				'paginate'    => true,
				'type'        => 'shop_order',
			)
		);
		return Responses::ok(
			array(
				'page'        => $page,
				'total_pages' => (int) $result->max_num_pages,
				'orders'      => array_map( array( OrderPresenter::class, 'summary' ), $result->orders ),
			)
		);
	}

	/** @return \WP_REST_Response|\WP_Error */
	public function order( \WP_REST_Request $req ) {
		$order = wc_get_order( (int) $req['id'] );
		if ( ! $order instanceof \WC_Order || ! OrderPresenter::belongsTo( $order, get_current_user_id() ) ) {
			// 404 et non 403 : on ne confirme pas l'existence d'une commande d'un autre client.
			return Responses::error( 'mm_not_found', 'Commande introuvable.', 404 );
		}
		return Responses::ok( OrderPresenter::detail( $order ) );
	}

	/**
	 * @param array<string, mixed> $in
	 * @return array<string, string>
	 */
	public static function sanitizeAddress( array $in ): array {
		$out = array();
		foreach ( self::ADDRESS_FIELDS as $f ) {
			if ( array_key_exists( $f, $in ) ) {
				$v = is_scalar( $in[ $f ] ) ? trim( (string) $in[ $f ] ) : '';
				if ( mb_strlen( $v ) > 120 ) {
					return array( 'error' => 'Champ trop long.' );
				}
				$out[ $f ] = function_exists( 'sanitize_text_field' ) ? sanitize_text_field( $v ) : strip_tags( $v );
			}
		}
		if ( isset( $out['country'] ) ) {
			$out['country'] = strtoupper( $out['country'] );
			if ( 1 !== preg_match( '/^[A-Z]{2}$/', $out['country'] ) ) {
				return array( 'error' => 'Pays invalide.' );
			}
		}
		if ( isset( $out['postcode'] ) && 1 !== preg_match( '/^[A-Za-z0-9 \-]{2,12}$/', $out['postcode'] ) ) {
			return array( 'error' => 'Code postal invalide.' );
		}
		return $out;
	}

	/** @return array<string, mixed> */
	private static function addressPayload( \WC_Customer $c ): array {
		$out = array();
		foreach ( array( 'billing', 'shipping' ) as $type ) {
			foreach ( self::ADDRESS_FIELDS as $f ) {
				$getter              = "get_{$type}_{$f}";
				$out[ $type ][ $f ] = method_exists( $c, $getter ) ? (string) $c->{$getter}() : '';
			}
		}
		$out['billing']['email'] = (string) $c->get_billing_email();
		return $out;
	}

	/** @return array<string, mixed> */
	private static function profile( ?\WP_User $u ): array {
		if ( ! $u || ! $u->exists() ) {
			return array();
		}
		$c = new \WC_Customer( $u->ID );
		return array(
			'id'         => $u->ID,
			'email'      => $u->user_email,
			'first_name' => $c->get_first_name(),
			'last_name'  => $c->get_last_name(),
			'phone'      => $c->get_billing_phone(),
		);
	}
}
