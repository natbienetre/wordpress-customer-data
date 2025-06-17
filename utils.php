<?php
/**
 * Utils
 *
 * @package VFS
 */

namespace VFS;

/**
 * Error log
 *
 * TODO: use wp_trigger_error() instead
 *
 * @param string      $message The message to log.
 * @param int         $type The type of log.
 * @param string|null $destination The destination of the log.
 * @param string|null $additional_headers The additional headers of the log.
 * @return void
 */
function error_log_debug( $message, $type = 0, $destination = null, $additional_headers = null ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG && defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		\error_log( $message, $type, $destination, $additional_headers );
	}
}
