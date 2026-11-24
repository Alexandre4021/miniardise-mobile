<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Security;

final class WpdbRateLimitStore implements RateLimitStore {
	private string $table;

	public function __construct( private readonly \wpdb $db ) {
		$this->table = $db->prefix . 'mm_rate_limits';
	}

	public function hit( string $bucket, int $windowStart ): int {
		$this->db->query(
			$this->db->prepare(
				"INSERT INTO {$this->table} (bucket, window_start, hits) VALUES (%s, %d, 1) ON DUPLICATE KEY UPDATE hits = hits + 1", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$bucket,
				$windowStart
			)
		);
		return (int) $this->db->get_var(
			$this->db->prepare( "SELECT hits FROM {$this->table} WHERE bucket = %s AND window_start = %d", $bucket, $windowStart ) // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);
	}

	public function purgeBefore( int $timestamp ): void {
		$this->db->query( $this->db->prepare( "DELETE FROM {$this->table} WHERE window_start < %d", $timestamp ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	}
}
