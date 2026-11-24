<?php

declare(strict_types=1);

namespace MiniarDise\Mobile;

use MiniarDise\Mobile\Auth\BearerAuthenticator;
use MiniarDise\Mobile\Auth\TokenService;
use MiniarDise\Mobile\Auth\WpdbTokenRepository;
use MiniarDise\Mobile\Install\Schema;
use MiniarDise\Mobile\Rest\AuthController;
use MiniarDise\Mobile\Rest\ConfigController;
use MiniarDise\Mobile\Rest\HomeController;
use MiniarDise\Mobile\Security\RateLimiter;
use MiniarDise\Mobile\Security\SecurityLog;
use MiniarDise\Mobile\Security\WpdbRateLimitStore;
use MiniarDise\Mobile\Staging\RecetteAppAccess;
use MiniarDise\Mobile\Support\SystemClock;

final class Plugin {
	public static function boot(): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action(
				'admin_notices',
				static function (): void {
					echo '<div class="notice notice-error"><p>MiniarDise Mobile nécessite WooCommerce.</p></div>';
				}
			);
			return;
		}

		if ( get_option( 'mm_db_version' ) !== MM_DB_VERSION ) {
			Schema::install();
		}

		global $wpdb;
		$clock   = new SystemClock();
		$repo    = new WpdbTokenRepository( $wpdb );
		$tokens  = new TokenService( $repo, $clock );
		$limiter = new RateLimiter( new WpdbRateLimitStore( $wpdb ), $clock );
		$log     = new SecurityLog( $wpdb );

		( new BearerAuthenticator( $tokens ) )->register();
		( new RecetteAppAccess() )->register();

		add_action(
			'rest_api_init',
			static function () use ( $tokens, $limiter, $log ): void {
				( new ConfigController() )->register();
				( new HomeController() )->register();
				( new AuthController( $tokens, $limiter, $log ) )->register();
			}
		);

		// Les réponses de l'API de l'app ne doivent jamais être mises en cache par les extensions de cache.
		add_filter(
			'rest_pre_dispatch',
			static function ( $result, $server, \WP_REST_Request $request ) {
				if ( BearerAuthenticator::isAppRoute( $request->get_route() ) && ! defined( 'DONOTCACHEPAGE' ) ) {
					define( 'DONOTCACHEPAGE', true );
				}
				return $result;
			},
			10,
			3
		);

		// Révocation de toutes les sessions de l'app quand le mot de passe change ou que le compte disparaît.
		$revokeAll = static fn( int $userId ) => $tokens->revokeUser( $userId );
		add_action( 'after_password_reset', static fn( \WP_User $u ) => $revokeAll( $u->ID ) );
		add_action( 'wp_set_password', static fn( $password, $userId ) => $revokeAll( (int) $userId ), 10, 2 );
		add_action( 'delete_user', static fn( $userId ) => $revokeAll( (int) $userId ) );

		add_action(
			'mm_daily_cleanup',
			static function () use ( $repo, $wpdb, $log ): void {
				$repo->purgeExpired( time() );
				( new WpdbRateLimitStore( $wpdb ) )->purgeBefore( time() - DAY_IN_SECONDS );
				$log->purgeOlderThan( 180 );
			}
		);
	}
}
