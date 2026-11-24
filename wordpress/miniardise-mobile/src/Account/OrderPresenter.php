<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Account;

use MiniarDise\Mobile\Support\Money;

/**
 * Présentation d'une commande WooCommerce pour l'app (lecture seule, données du site).
 * Passe uniquement par l'API CRUD WooCommerce : compatible HPOS.
 */
final class OrderPresenter {
	/** Un client ne voit jamais la commande d'un autre (API1 OWASP). */
	public static function belongsTo( ?\WC_Order $order, int $userId ): bool {
		return null !== $order && $userId > 0 && (int) $order->get_customer_id() === $userId;
	}

	/** @return array<string, mixed> */
	public static function summary( \WC_Order $o ): array {
		$created = $o->get_date_created();
		return array(
			'id'           => $o->get_id(),
			'number'       => (string) $o->get_order_number(),
			'date'         => $created ? $created->date( 'c' ) : '',
			'status'       => $o->get_status(),
			'status_label' => wc_get_order_status_name( $o->get_status() ),
			'total'        => Money::toMinor( (float) $o->get_total() ),
			'currency'     => $o->get_currency(),
			'item_count'   => (int) $o->get_item_count(),
		);
	}

	/** @return array<string, mixed> */
	public static function detail( \WC_Order $o ): array {
		$items = array();
		foreach ( $o->get_items() as $item ) {
			if ( ! $item instanceof \WC_Order_Item_Product ) {
				continue;
			}
			$product = $item->get_product();
			$img     = $product ? wp_get_attachment_image_src( (int) $product->get_image_id(), 'woocommerce_thumbnail' ) : false;
			$items[] = array(
				'name'       => wp_strip_all_tags( $item->get_name() ),
				'quantity'   => (int) $item->get_quantity(),
				'total'      => Money::toMinor( (float) $item->get_total() + (float) $item->get_total_tax() ),
				'product_id' => (int) $item->get_product_id(),
				'image'      => is_array( $img ) ? (string) $img[0] : '',
			);
		}
		$shipping = array();
		foreach ( $o->get_shipping_methods() as $m ) {
			$shipping[] = wp_strip_all_tags( $m->get_name() );
		}
		return self::summary( $o ) + array(
			'items'            => $items,
			'subtotal'         => Money::toMinor( (float) $o->get_subtotal() + (float) $o->get_cart_tax() ),
			'shipping_total'   => Money::toMinor( (float) $o->get_shipping_total() + (float) $o->get_shipping_tax() ),
			'discount_total'   => Money::toMinor( (float) $o->get_discount_total() + (float) $o->get_discount_tax() ),
			'tax_total'        => Money::toMinor( (float) $o->get_total_tax() ),
			'shipping_methods' => $shipping,
			'payment_method'   => wp_strip_all_tags( $o->get_payment_method_title() ),
			'shipping_address' => self::lines( $o->get_formatted_shipping_address() ),
			'billing_address'  => self::lines( $o->get_formatted_billing_address() ),
			'needs_payment'    => $o->needs_payment(),
		);
	}

	/** @return string[] */
	public static function lines( string $formatted ): array {
		$parts = preg_split( '#<br\s*/?>#i', $formatted ) ?: array();
		return array_values( array_filter( array_map( static fn( $l ) => trim( html_entity_decode( strip_tags( $l ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ), $parts ) ) );
	}
}
