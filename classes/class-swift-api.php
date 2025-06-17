<?php
/**
 * KeySet class
 *
 * @package VFS
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace VFS;

use DateTime;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Class Swift_Api
 *
 * @since 1.0.0
 */
class Swift_Api {

	/**
	 * REST API namespace
	 *
	 * @var string
	 */
	protected $namespace = Api::NAMESPACE;

	/**
	 * REST API base path
	 *
	 * @var string
	 */
	protected $rest_base = '/swift';

	/**
	 * Option name for storing keys
	 *
	 * @var string
	 */
	public const OPTION_NAME = 'vfs_swift_api';

	public const PATH_SEPARATOR = '/';

	/**
	 * Register hooks
	 */
	public static function register_hooks() {
		$instance = new self();

		add_action( 'rest_api_init', array( $instance, 'rest_api_init' ) );
	}

	/**
	 * Get all supported HTTP methods
	 *
	 * @return string[] All HTTP methods.
	 */
	public static function all_http_methods() {
		return apply_filters( 'vfs_swift_api_all_http_methods', array( 'GET', 'PUT', 'DELETE' ) );
	}

	/**
	 * Generate signature
	 *
	 * @since 1.0.0
	 * @param string   $hmac_algo HMAC algorithm.
	 * @param string   $absolute_path Absolute path.
	 * @param bool     $prefix Whether to use prefix.
	 * @param DateTime $expires_at Expiration date.
	 * @param string   $method HTTP method.
	 * @param string   $secret_key Secret key.
	 * @return string Signature.
	 */
	protected function new_signature( string $hmac_algo, string $absolute_path, bool $prefix, DateTime $expires_at, string $method, string $secret_key ) {
		$options = Options::load();

		$data = strtoupper( $method ) . "\n" . $expires_at->getTimestamp() . "\n";
		if ( $prefix ) {
			$data .= 'prefix:' . $absolute_path;
		} else {
			$data .= $absolute_path;
		}

		if ( WP_DEBUG ) {
			if ( $prefix ) {
				error_log_debug( "Generating {$hmac_algo} signature for prefix {$absolute_path} expires at {$expires_at->format( 'Y-m-d H:i:s' )} for method {$method}" ); // phpcs:ignore
			} else {
				error_log_debug( "Generating {$hmac_algo} signature for path {$absolute_path} expires at {$expires_at->format( 'Y-m-d H:i:s' )} for method {$method}" ); // phpcs:ignore
			}

			if ( ! str_starts_with( $absolute_path, wp_parse_url( $options->get_swift_account_url(), PHP_URL_PATH ) . $options->swift_container . self::PATH_SEPARATOR . $options->swift_additional_prefix ) ) {
				error_log_debug( 'Path is not inside the Swift container.' ); // phpcs:ignore
			}
		}

		return hash_hmac( $hmac_algo, $data, $secret_key, false );
	}

	/**
	 * Get absolute path with `swift_additional_prefix` option.
	 *
	 * @since 1.0.0
	 * @param string $path Path.
	 * @return string|WP_Error Absolute path or error.
	 */
	protected function absolute_path_with_prefix( string $path ) {
		$options = Options::load();

		$prefix = wp_parse_url( $options->get_swift_account_url(), PHP_URL_PATH );
		if ( false === $prefix ) {
			return new WP_Error( 'invalid_swift_account_url', __( 'Invalid Swift account URL', 'vfs' ) );
		}

		return $prefix . $options->swift_container . self::PATH_SEPARATOR . $options->swift_additional_prefix . ltrim( $path, self::PATH_SEPARATOR );
	}

	/**
	 * Get absolute path
	 *
	 * @since 1.0.0
	 * @param string $path Path.
	 * @return string|WP_Error Absolute path or error.
	 */
	protected function absolute_path( string $path ) {
		$options = Options::load();

		$prefix = wp_parse_url( $options->get_swift_account_url(), PHP_URL_PATH );
		if ( false === $prefix ) {
			return new WP_Error( 'invalid_swift_account_url', __( 'Invalid Swift account URL', 'vfs' ) );
		}

		return $prefix . $options->swift_container . PATH_SEPARATOR . $path;
	}

	/**
	 * Generate signature
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function handle_generate_signature( WP_REST_Request $request ) {
		$body        = json_decode( $request->get_body(), true );
		$path        = isset( $body['path'] ) ? $body['path'] : false;
		$method      = isset( $body['method'] ) ? $body['method'] : '';
		$expires_at  = isset( $body['expiresAt'] ) ? $body['expiresAt'] : '';
		$path_prefix = isset( $body['pathPrefix'] ) ? $body['pathPrefix'] : false;

		if ( false === $path && false === $path_prefix ) {
			return new WP_REST_Response(
				new WP_Error( 'invalid_path', __( 'Path or path prefix is required', 'vfs' ) ),
				400
			);
		}

		if ( $path && $path_prefix ) {
			return new WP_REST_Response(
				new WP_Error( 'invalid_path', __( 'Path and path prefix cannot both be set', 'vfs' ) ),
				400
			);
		}

		$result = $this->generate_signature(
			$path ? $path : $path_prefix,
			$method,
			$expires_at,
			$path_prefix
		);

		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				$result,
				$result->get_error_data()['status'] ?? 500
			);
		}

		return new WP_REST_Response(
			$result,
			201
		);
	}

	/**
	 * Generate signature
	 *
	 * @since 1.0.0
	 * @param string          $path Path.
	 * @param string          $method Method.
	 * @param string|DateTime $expires_at Expires at.
	 * @param bool            $prefix Whether to use prefix.
	 * @return array|\WP_Error Response or error.
	 */
	public function generate_signature( $path, $method, $expires_at, $prefix = true ) {
		if ( ! in_array( $method, self::all_http_methods(), true ) ) {
			return new WP_Error( 'invalid_method', __( 'Invalid method', 'vfs' ), array( 'status' => 400 ) );
		}

		if ( ! ( $expires_at instanceof DateTime ) ) {
			$expires_at = $expires_at ? new DateTime( $expires_at ) : new DateTime( '+365 days' );
		}
		if ( ! $expires_at ) {
			return new WP_Error( 'invalid_expires_at', __( 'Invalid expiration date', 'vfs' ), array( 'status' => 400 ) );
		}

		if ( $expires_at < new DateTime() ) {
			return new WP_Error( 'invalid_expires_at', __( 'Expiration date cannot be in the past', 'vfs' ), array( 'status' => 400 ) );
		}

		$absolute_path = $this->absolute_path_with_prefix( $path );
		if ( is_wp_error( $absolute_path ) ) {
			return $absolute_path;
		}

		$options = Options::load();

		$signature_key = $options->get_signature_key( $options->swift_signature_location );
		if ( is_wp_error( $signature_key ) ) {
			return $signature_key;
		}

		return array(
			'signature' => $this->new_signature( $options->swift_signature_hmac_algo, $absolute_path, $prefix, $expires_at, $method, $signature_key ),
			'hmacAlgo'  => $options->swift_signature_hmac_algo,
			'expiresAt' => $expires_at->getTimestamp(),
			'path'      => $absolute_path,
		);
	}

	/**
	 * Register REST API routes
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_routes() {
		$options = Options::load();

		if ( $options->key_management->enabled ) {
			register_rest_route(
				$this->namespace,
				'/' . $this->rest_base . '/signature',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'handle_generate_signature' ),
					'permission_callback' => array( $this, 'generate_signature_permissions_check' ),
					'schema'              => array( $this, 'generate_signature_schema' ),
					'args'                => array(
						'path'       => array(
							'type'     => 'string',
							'required' => false,
						),
						'pathPrefix' => array(
							'type'     => 'string',
							'required' => false,
						),
						'expiresAt'  => array(
							'type'     => 'date-time',
							'required' => false,
						),
						'method'     => array(
							'type'     => 'enum',
							'required' => false,
							'enum'     => self::all_http_methods(),
						),
					),
				)
			);
		}
	}

	/**
	 * Check permissions for generating signature
	 *
	 * @since 1.0.0
	 * @return bool Whether user can manage options.
	 */
	public function generate_signature_permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get schema for generating signature
	 *
	 * @since 1.0.0
	 * @return array Schema.
	 */
	public function generate_signature_schema() {
		return array( $this, 'generate_signature_schema' );
	}

	/**
	 * Initialize REST API
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function rest_api_init() {
		$this->register_routes();
	}

	/**
	 * Join two paths.
	 *
	 * @param string $path1 The first path.
	 * @param string $path2 The second path.
	 * @return string The joined path.
	 */
	public static function path_join( string $path1, string $path2 ) {
		return rtrim( $path1, self::PATH_SEPARATOR ) . self::PATH_SEPARATOR . ltrim( $path2, self::PATH_SEPARATOR );
	}
}
