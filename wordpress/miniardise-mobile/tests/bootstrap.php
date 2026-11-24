<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

// Doublure minimale de WP_Error pour les tests unitaires sans WordPress.
if ( ! class_exists( 'WP_Error' ) ) {
	// phpcs:ignore
	class WP_Error {
		/** @param array<string, mixed> $data */
		public function __construct( private string $code = '', private string $message = '', private $data = '' ) {}
		public function get_error_code(): string { return $this->code; }
		public function get_error_message(): string { return $this->message; }
		/** @return mixed */
		public function get_error_data() { return $this->data; }
	}
}

// Doublure minimale de WC_Order (propriété du client uniquement).
if ( ! class_exists( 'WC_Order' ) ) {
	// phpcs:ignore
	class WC_Order {
		public function __construct( private int $customerId = 0 ) {}
		public function get_customer_id(): int { return $this->customerId; }
	}
}
