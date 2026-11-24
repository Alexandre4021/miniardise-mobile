<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Catalog;

/**
 * Avis produits (avis WooCommerce alimentés par l'extension « MiniarDise Avis clients ») :
 * note, texte, « acheteur vérifié », photo facultative.
 */
final class Reviews {
	public const MIN_FOR_HOME = 3; // comme le site : pas de bloc tant qu'il y a moins de 3 avis

	/** @return array<string, mixed> */
	public static function forProduct( int $productId, int $limit = 10 ): array {
		$product = wc_get_product( $productId );
		$items   = get_comments(
			array(
				'post_id' => $productId,
				'type'    => 'review',
				'status'  => 'approve',
				'number'  => $limit,
				'orderby' => 'comment_date_gmt',
				'order'   => 'DESC',
			)
		);
		return array(
			'count'   => $product ? (int) $product->get_review_count() : 0,
			'average' => $product ? round( (float) $product->get_average_rating(), 1 ) : 0.0,
			'items'   => array_map( array( self::class, 'item' ), is_array( $items ) ? $items : array() ),
		);
	}

	/** @return array<string, mixed> */
	public static function latest( int $limit = 6 ): array {
		global $wpdb;
		$items = get_comments(
			array(
				'type'        => 'review',
				'status'      => 'approve',
				'number'      => $limit,
				'orderby'     => 'comment_date_gmt',
				'order'       => 'DESC',
				'post_type'   => 'product',
				'post_status' => 'publish',
			)
		);
		if ( ! is_array( $items ) || count( $items ) < self::MIN_FOR_HOME ) {
			return array( 'count' => 0, 'average' => 0.0, 'items' => array() );
		}
		$agg = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			"SELECT COUNT(*) AS n, AVG(CAST(m.meta_value AS DECIMAL(3,2))) AS avg FROM {$wpdb->comments} c
			 JOIN {$wpdb->commentmeta} m ON m.comment_id = c.comment_ID AND m.meta_key = 'rating'
			 JOIN {$wpdb->posts} p ON p.ID = c.comment_post_ID AND p.post_type = 'product' AND p.post_status = 'publish'
			 WHERE c.comment_type = 'review' AND c.comment_approved = '1'"
		);
		return array(
			'count'   => (int) ( $agg->n ?? 0 ),
			'average' => round( (float) ( $agg->avg ?? 0 ), 1 ),
			'items'   => array_map( array( self::class, 'item' ), $items ),
		);
	}

	/** @return array<string, mixed> */
	public static function item( \WP_Comment $c ): array {
		$id      = (int) $c->comment_ID;
		$photoId = (int) get_comment_meta( $id, 'moav_photo', true );
		$photo   = $photoId ? wp_get_attachment_image_src( $photoId, 'medium_large' ) : false;
		return self::shape(
			$id,
			(int) $c->comment_post_ID,
			(string) get_the_title( (int) $c->comment_post_ID ),
			(string) $c->comment_author,
			(int) get_comment_meta( $id, 'rating', true ),
			(string) $c->comment_content,
			(string) $c->comment_date_gmt,
			(bool) get_comment_meta( $id, 'verified', true ),
			is_array( $photo ) ? (string) $photo[0] : ''
		);
	}

	/** @return array<string, mixed> */
	public static function shape( int $id, int $productId, string $productName, string $author, int $rating, string $content, string $dateGmt, bool $verified, string $photo ): array {
		$content = preg_replace( '#<\s*(script|style)[^>]*>.*?<\s*/\s*\1\s*>#is', '', $content ) ?? '';
		$text    = trim( preg_replace( '/\s+/u', ' ', html_entity_decode( strip_tags( $content ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) ?? '' );
		return array(
			'id'           => $id,
			'product_id'   => $productId,
			'product_name' => html_entity_decode( $productName, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			'author'       => mb_substr( trim( $author ), 0, 60 ),
			'rating'       => max( 0, min( 5, $rating ) ),
			'text'         => $text,
			'date'         => '' !== $dateGmt ? gmdate( 'c', (int) strtotime( $dateGmt . ' UTC' ) ) : '',
			'verified'     => $verified,
			'photo'        => 1 === preg_match( '#^https?://#', $photo ) ? $photo : '',
		);
	}
}
