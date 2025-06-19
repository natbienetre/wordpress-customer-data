<?php
/**
 * CustomerData options class
 *
 * @package CustomerData
 * @version 1.0.0
 * @author  Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace CustomerData;

use OpenStack\Common\Error\BadResponseError;
use WP_Error;

/**
 * Options class
 *
 * @package CustomerData
 * @version 1.0.0
 * @author  Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */
class Options {

	/**
	 * Option name
	 *
	 * @var string
	 */
	const OPTION_NAME = 'customer_data_options';

	/**
	 * Swift auth URL
	 *
	 * @var string
	 */
	public string $swift_auth_url;

	/**
	 * Swift identity API version
	 *
	 * @var string
	 */
	public string $swift_identity_api_version;

	/**
	 * Swift user domain name
	 *
	 * @var string
	 */
	public string $swift_user_domain_name;

	/**
	 * Swift tenant ID
	 *
	 * @var string
	 */
	public string $swift_tenant_id;

	/**
	 * Swift tenant name
	 *
	 * @var string
	 */
	public string $swift_tenant_name;

	/**
	 * Swift user
	 *
	 * @var string
	 */
	public string $swift_user;

	/**
	 * Swift password
	 *
	 * @var string
	 */
	public string $swift_password;

	/**
	 * Swift region
	 *
	 * @var string
	 */
	public string $swift_region;

	/**
	 * Signature key location
	 *
	 * @var Temp_Key_Location|null
	 */
	public Temp_Key_Location|null $swift_signature_location;

	/**
	 * Signature key value
	 *
	 * @var string
	 */
	public string $swift_signature_value;

	/**
	 * Signature key static
	 *
	 * @var boolean
	 */
	public bool $swift_signature_static;

	/**
	 * Signature algo
	 *
	 * @var string
	 */
	public string $swift_signature_hmac_algo;

	/**
	 * Swift base URL
	 *
	 * @var string
	 */
	public string $swift_account_url;

	/**
	 * Swift container
	 *
	 * @var string
	 */
	public string $swift_container;

	/**
	 * Additional prefix path
	 *
	 * @var string
	 */
	public string $swift_additional_prefix;

	/**
	 * Form page ID
	 *
	 * @var string
	 */
	public string $form_page_id;

	/**
	 * Inject keyset
	 *
	 * @var boolean
	 */
	public bool $inject_keyset;

	/**
	 * Allow scoped tokens
	 *
	 * @var boolean
	 */
	public bool $allow_scoped_tokens;

	/**
	 * Key management
	 *
	 * @var Key_Management
	 */
	public Key_Management $key_management;

	protected const CATALOG_CACHE_KEY = 'openstack_catalog';
	protected const TOKEN_CACHE_KEY   = 'openstack_token';

	public const SWIFT_URL_NOT_FOUND_IN_CATALOG_ERROR_CODE = 'customer_data_swift_url_not_found_in_catalog';

	/**
	 * Constructor
	 *
	 * @param array $options Options to initialize the object with.
	 */
	public function __construct( array $options = array() ) {
		$options = wp_parse_args( $options, self::defaults() );

		$this->swift_auth_url             = $options['swift_auth_url'];
		$this->swift_region               = $options['swift_region'];
		$this->swift_identity_api_version = $options['swift_identity_api_version'];
		$this->swift_user_domain_name     = $options['swift_user_domain_name'];
		$this->swift_tenant_id            = $options['swift_tenant_id'];
		$this->swift_tenant_name          = $options['swift_tenant_name'];
		$this->swift_user                 = $options['swift_user'];
		$this->swift_password             = $options['swift_password'];
		$this->swift_signature_location   = $options['swift_signature_location'];
		$this->swift_signature_value      = $options['swift_signature_value'];
		$this->swift_signature_static     = $options['swift_signature_static'];
		$this->swift_account_url          = $options['swift_account_url'];
		$this->swift_container            = $options['swift_container'];
		$this->swift_additional_prefix    = $options['swift_additional_prefix'];
		$this->swift_signature_hmac_algo  = $options['swift_signature_hmac_algo'];
		$this->inject_keyset              = $options['inject_keyset'];
		$this->key_management             = $options['key_management'];
		$this->allow_scoped_tokens        = $options['allow_scoped_tokens'];
	}

	/**
	 * Register hooks
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_hooks() {
		register_activation_hook( CUSTOMER_DATA_PLUGIN_FILE, array( __CLASS__, 'add_options' ) );

		$instance = new self();

		add_action( 'plugins_loaded', array( $instance, 'init' ) );
		add_action( 'admin_init', array( $instance, 'register_settings' ) );
		add_filter( 'customer_data_valids_hmac_algos', array( $instance, 'filter_out_deprecated_algorithms' ) );
	}

	/**
	 * Trigger hooks when plugins are loaded
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function plugins_loaded() {
		self::add_options();
	}

	/**
	 * Get the default options
	 *
	 * @return array
	 */
	public static function defaults(): array {
		return array(
			'swift_auth_url'             => '',
			'swift_region'               => '',
			'swift_identity_api_version' => '3',
			'swift_user_domain_name'     => 'Default',
			'swift_tenant_id'            => '',
			'swift_tenant_name'          => '',
			'swift_user'                 => '',
			'swift_password'             => '',
			'swift_container'            => 'wordpress',
			'swift_account_url'          => '',
			'swift_signature_location'   => null,
			'swift_signature_value'      => '',
			'swift_signature_static'     => false,
			'swift_additional_prefix'    => 'customer-data/',
			'swift_signature_hmac_algo'  => 'SHA-512',
			'inject_keyset'              => false,
			'key_management'             => new Key_Management( true, '', '' ),
			'allow_scoped_tokens'        => false,
		);
	}

	/**
	 * Load the options from the database
	 *
	 * @return Options
	 */
	public static function load(): Options {
		global $customer_data_opts;

		if ( empty( $customer_data_opts ) ) {
			$customer_data_opts = new self( (array) get_option( self::OPTION_NAME, self::defaults() ) );
		}

		return $customer_data_opts;
	}

	/**
	 * Save the options to the database
	 *
	 * @return bool
	 */
	public function save(): bool {
		return update_option( self::OPTION_NAME, (array) $this );
	}

	/**
	 * Add the options to the database
	 *
	 * @return void
	 */
	public static function add_options() {
		add_option( self::OPTION_NAME, self::defaults() );
	}

	/**
	 * Get OpenStack instance
	 *
	 * @return \OpenStack\OpenStack
	 */
	public function get_openstack() {
		$openstack = new \OpenStack\OpenStack(
			array(
				'authUrl' => $this->swift_auth_url,
				'region'  => $this->swift_region,
				'user'    => array(
					'name'     => $this->swift_user,
					'password' => $this->swift_password,
					'domain'   => array(
						'name' => $this->swift_user_domain_name,
					),
				),
			)
		);

		return $openstack;
	}

	/**
	 * Get available regions
	 *
	 * @return array|WP_Error
	 * @throws \Exception If catalog is unsupported.
	 */
	public function get_available_regions() {
		$catalog = $this->get_openstack_catalog();

		if ( is_wp_error( $catalog ) ) {
			return $catalog;
		}

		if ( $catalog instanceof \OpenStack\Identity\v3\Models\Catalog ) {
			return array_unique(
				array_merge(
					...array_map(
						function ( $service ) {
							return array_map(
								function ( $endpoint ) {
									return $endpoint->region;
								},
								$service->endpoints
							);
						},
						$catalog->services
					)
				)
			);
		}

		if ( $catalog instanceof \OpenStack\Identity\v2\Models\Catalog ) {
			return array_unique(
				array_merge(
					...array_map(
						function ( $entry ) {
							return array_map(
								function ( $endpoint ) {
									return $endpoint->region;
								},
								$entry->endpoints
							);
						},
						$catalog->entries
					)
				)
			);
		}

		throw new \Exception( 'Invalid catalog' );
	}

	/**
	 * Get OpenStack catalog
	 *
	 * @return \OpenStack\Identity\v3\Models\Catalog|\OpenStack\Identity\v2\Models\Catalog|WP_Error
	 */
	public function get_openstack_catalog() {
		$catalog = Cache::get( self::CATALOG_CACHE_KEY );
		if ( false === $catalog ) {
			$token = $this->new_openstack_token();
			if ( is_wp_error( $token ) ) {
				return $token;
			}

			$catalog = $token->catalog;
			Cache::set( self::CATALOG_CACHE_KEY, $catalog );
		}

		return $catalog;
	}

	/**
	 * Create a new OpenStack token
	 *
	 * @return \OpenStack\Identity\v3\Models\Token|\OpenStack\Identity\v2\Models\Token|WP_Error
	 */
	protected function new_openstack_token() {
		$openstack = $this->get_openstack();

		if ( '3' === $this->swift_identity_api_version ) {
			$identity = $openstack->identityV3();
		} else {
			$identity = $openstack->identityV2();
		}

		try {
			$openstack_token = $identity->generateToken(
				array(
					'user' => array(
						'name'     => $this->swift_user,
						'password' => $this->swift_password,
						'domain'   => array(
							'name' => $this->swift_user_domain_name,
						),
					),
				)
			);
		} catch ( BadResponseError $e ) {
			$response = $e->getResponse();
			if ( 401 === $response->getStatusCode() ) {
				return new WP_Error(
					'customer_data_openstack_token_generation_failed',
					__( 'Invalid OpenStack credentials', 'customer-data' ),
					array(
						'response' => $response,
					)
				);
			}

			return new WP_Error(
				'customer_data_openstack_token_generation_failed',
				$e->getMessage(),
				array(
					'response' => $response,
				)
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'customer_data_openstack_token_generation_failed', $e->getMessage() );
		}

		return $openstack_token;
	}

	/**
	 * Register settings
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_settings() {
		register_setting(
			self::OPTION_NAME,
			self::OPTION_NAME,
			array(
				'type'              => 'array',
				'description'       => __( 'All CustomerData options registered in this site.', 'customer-data' ),
				'label_for'         => __( 'CustomerData options', 'customer-data' ),
				'default'           => self::defaults(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_setting' ),
			)
		);
	}


	/**
	 * Get OpenStack token
	 *
	 * @return string|WP_Error
	 */
	public function openstack_token() {
		$token = Cache::get( self::TOKEN_CACHE_KEY );
		if ( false === $token ) {
			$token = $this->new_openstack_token();
			if ( is_wp_error( $token ) ) {
				return $token;
			}

			$token_id = $token->getId();
			Cache::set( self::TOKEN_CACHE_KEY, $token_id, $token->expires->getTimestamp() - time() );
			Cache::set( self::CATALOG_CACHE_KEY, $token->catalog );

			return $token_id;
		}

		return $token;
	}

	/**
	 * Get Swift account URL
	 *
	 * @return string|WP_Error
	 */
	public function get_swift_account_url() {
		if ( ! empty( $this->swift_account_url ) ) {
			return $this->swift_account_url;
		}

		return $this->get_swift_account_url_from_catalog();
	}

	/**
	 * Get Swift account URL from catalog
	 *
	 * @return string|WP_Error
	 */
	public function get_swift_account_url_from_catalog() {
		$catalog = $this->get_openstack_catalog();
		if ( is_wp_error( $catalog ) ) {
			return $catalog;
		}

		try {
			$url = $catalog->getServiceUrl( 'swift', 'object-store', $this->swift_region, 'public' );
		} catch ( \Exception $e ) {
			return new WP_Error(
				self::SWIFT_URL_NOT_FOUND_IN_CATALOG_ERROR_CODE,
				__( 'Failed to get object-store URL from the OpenStack catalog', 'customer-data' ),
				array(
					'cause'   => $e,
					'catalog' => $catalog,
				)
			);
		}

		if ( false === $url ) {
			return new WP_Error( self::SWIFT_URL_NOT_FOUND_IN_CATALOG_ERROR_CODE, __( 'Swift account URL not found in the catalog.', 'customer-data' ) );
		}

		return trailingslashit( $url );
	}

	/**
	 * Filter out deprecated algorithms
	 *
	 * @since 1.0.0
	 * @param array $algos List of algorithms.
	 * @return array Filtered list of algorithms.
	 */
	public function filter_out_deprecated_algorithms( array $algos ): array {
		$info = $this->get_swift_info();
		if ( is_wp_error( $info ) ) {
			return $algos;
		}

		$deprecated_digests = $info->tempurl->deprecated_digests;

		return array_filter(
			$algos,
			function ( $algo ) use ( $deprecated_digests ) {
				return ! in_array( $algo, $deprecated_digests, true );
			}
		);
	}

	/**
	 * Get Swift info
	 *
	 * @since 1.0.0
	 * @return \stdClass|WP_Error Swift info.
	 */
	public function get_swift_info() {
		$info = Cache::get( 'customer_data_swift_info' );
		if ( false !== $info ) {
			return $info;
		}

		$openstack = $this->get_openstack();
		if ( is_wp_error( $openstack ) ) {
			return $openstack;
		}

		try {
			$response = $openstack->objectStoreV1( array( 'region' => $this->swift_region ) )->execute(
				array(
					'method' => 'GET',
					'path'   => '/info',
					'params' => array(),
				)
			);
		} catch ( \Exception $e ) {
			return new WP_Error(
				self::SWIFT_URL_NOT_FOUND_IN_CATALOG_ERROR_CODE,
				__( 'Failed to get container metadata.', 'customer-data' ),
				array(
					'cause' => $e,
				)
			);
		}

		if ( 200 !== $response->getStatusCode() ) {
			return new WP_Error(
				self::SWIFT_URL_NOT_FOUND_IN_CATALOG_ERROR_CODE,
				__( 'Failed to get Swift info.', 'customer-data' ),
				array(
					'cause' => $response,
				)
			);
		}

		$info = json_decode( $response->getBody()->getContents() );

		Cache::set( 'customer_data_swift_info', $info );

		return $info;
	}

	/**
	 * Get signature key
	 *
	 * @since 1.0.0
	 * @param Temp_Key_Location $location Key location.
	 * @return string|WP_Error Signature key.
	 */
	public function get_signature_key( Temp_Key_Location $location ) {
		$keys = $this->get_signature_keys_from_swift();
		if ( is_wp_error( $keys ) ) {
			return $keys;
		}
		return $keys->get_key( $location );
	}

	/**
	 * Get available algorithms
	 *
	 * @return array|WP_Error
	 */
	public function get_available_algorithms() {
		$info = $this->get_swift_info();
		if ( is_wp_error( $info ) ) {
			return $info;
		}

		$allowed_digests = $info->tempurl->allowed_digests;

		sort( $allowed_digests );

		/**
		 * Filter the list of supporteded signature algorithms.
		 *
		 * @see https://github.com/openstack/swift/blob/05143a99f8f3c860a887e4eb49688aef1e7a4a78/swift/common/middleware/tempurl.py#L292C16-L292C29
		 *
		 * @since 0.1.0
		 *
		 * @param array $algos List of supported signature algorithms.
		 */
		return apply_filters( 'customer_data_valids_hmac_algos', $allowed_digests );
	}

	/**
	 * Get signature keys from container
	 *
	 * @return Temp_Keys|WP_Error
	 */
	public function get_signature_keys_from_swift() {
		$openstack = $this->get_openstack();
		if ( is_wp_error( $openstack ) ) {
			return $openstack;
		}

		try {
			$swift = $openstack->objectStoreV1( array( 'region' => $this->swift_region ) );
		} catch ( \Exception $e ) {
			return new WP_Error(
				self::SWIFT_URL_NOT_FOUND_IN_CATALOG_ERROR_CODE,
				__( 'Failed to get signature keys from Swift.', 'customer-data' ),
				array(
					'cause' => $e,
				)
			);
		}

		return new Temp_Keys( $swift, $this->swift_container );
	}

	/**
	 * Sanitize settings
	 *
	 * @since 1.0.0
	 * @param array $value Settings value.
	 * @return array Sanitized settings.
	 */
	public static function sanitize_setting( $value ) {
		$sanitized = self::load();

		$sanitized->allow_scoped_tokens = isset( $value['allow_scoped_tokens'] ) ? (bool) $value['allow_scoped_tokens'] : false;

		$sanitized->swift_user                 = $value['swift_user'];
		$sanitized->swift_region               = $value['swift_region'];
		$sanitized->swift_auth_url             = $value['swift_auth_url'];
		$sanitized->swift_password             = $value['swift_password'];
		$sanitized->swift_tenant_id            = $value['swift_tenant_id'];
		$sanitized->swift_tenant_name          = $value['swift_tenant_name'];
		$sanitized->swift_user_domain_name     = $value['swift_user_domain_name'];
		$sanitized->swift_identity_api_version = $value['swift_identity_api_version'];
		$sanitized->swift_signature_value      = $value['swift_signature_value'];
		$sanitized->swift_signature_static     = isset( $value['swift_signature_static'] ) ? (bool) $value['swift_signature_static'] : false;

		$sanitized->swift_container   = $value['swift_container'];
		$sanitized->swift_account_url = empty( $value['swift_account_url'] ) ? '' : trailingslashit( $value['swift_account_url'] );

		if ( isset( $value['swift_signature_location'] ) ) {
			if ( empty( $value['swift_signature_location'] ) ) {
				$sanitized->swift_signature_location = null;
			} elseif ( is_string( $value['swift_signature_location'] ) ) {
					$location = json_decode( $value['swift_signature_location'], true );
				if ( ! is_null( $location ) ) {
					$sanitized->swift_signature_location = new Temp_Key_Location( $location['location'], $location['metadata_key'] );
				} else {
					$location = explode( '/', $value['swift_signature_location'], 2 );
					if ( 2 === count( $location ) ) {
						$sanitized->swift_signature_location = new Temp_Key_Location( $location[0], $location[1] );
					}
				}
			} elseif ( is_array( $value['swift_signature_location'] ) ) {
				$sanitized->swift_signature_location = new Temp_Key_Location( $value['swift_signature_location']['location'], $value['swift_signature_location']['metadata_key'] );
			} else {
				$sanitized->swift_signature_location = $value['swift_signature_location'];
			}
		}
		$sanitized->swift_additional_prefix   = ltrim( trailingslashit( $value['swift_additional_prefix'] ), '/' );
		$sanitized->swift_signature_hmac_algo = $value['swift_signature_hmac_algo'];

		if ( $value['key_management'] instanceof Key_Management ) {
			$sanitized->key_management = $value['key_management'];
		} else {
			$sanitized->key_management = new Key_Management(
				$value['key_management']['enabled'],
				isset( $value['key_management']['main_key'] ) ? $value['key_management']['main_key'] : $sanitized->key_management->main_key,
				$value['key_management']['jwks_url']
			);
		}

		if ( $sanitized->key_management->enabled ) {
			if ( ! empty( $sanitized->key_management->main_key ) ) {
				$keyset = new Keyset();
				if ( ! $keyset->get_key( $sanitized->key_management->main_key ) ) {
					add_settings_error(
						self::OPTION_NAME,
						'key_management_main_key_error',
						sprintf(
							/* translators: %s: Key ID */
							__( 'Main key %s not found', 'customer-data' ),
							$sanitized->key_management->main_key
						)
					);
				}
			}

			if ( ! empty( $sanitized->key_management->jwks_url ) ) {
				$jwks_url = filter_var( $sanitized->key_management->jwks_url, FILTER_VALIDATE_URL );
				if ( false === $jwks_url ) {
					add_settings_error(
						self::OPTION_NAME,
						'jwks_url_invalid',
						__( 'JWKS URL is not a valid URL.', 'customer-data' )
					);
				}
			}
		}

		$regions = $sanitized->get_available_regions();
		if ( empty( $sanitized->swift_region ) ) {
			add_settings_error(
				self::OPTION_NAME,
				'swift_region_error',
				__( 'Swift region is not set.', 'customer-data' )
			);
		} elseif ( is_wp_error( $regions ) ) {
			add_settings_error(
				self::OPTION_NAME,
				'openstack_token_error',
				$regions->get_error_message()
			);
		} elseif ( ! in_array( $sanitized->swift_region, $regions, true ) ) {
			add_settings_error(
				self::OPTION_NAME,
				'swift_region_error',
				sprintf(
					/* translators: %s: Swift region */
					__( 'Swift region %s is not available.', 'customer-data' ),
					$sanitized->swift_region
				)
			);
		}

		$swift_account_url = $sanitized->get_swift_account_url();
		if ( is_wp_error( $swift_account_url ) ) {
			if ( self::SWIFT_URL_NOT_FOUND_IN_CATALOG_ERROR_CODE === $swift_account_url->get_error_code() && empty( $value['swift_account_url'] ) ) {
				add_settings_error(
					self::OPTION_NAME,
					'swift_account_url_error',
					__( 'Swift account URL is not set, and not found in the catalog.', 'customer-data' )
				);
			} else {
				add_settings_error(
					self::OPTION_NAME,
					'openstack_token_error',
					$swift_account_url->get_error_message()
				);
			}
		} elseif ( false !== $swift_account_url && ! empty( $value['swift_account_url'] ) && trailingslashit( $swift_account_url ) !== $value['swift_account_url'] ) {
			add_settings_error(
				self::OPTION_NAME,
				'swift_account_url_mismatch',
				sprintf(
					/* translators: %s: Swift account URL from the catalog */
					__( 'Swift account URL does not match the catalog URL. The catalog URL is %s.', 'customer-data' ),
					$swift_account_url
				),
				'warning'
			);
		}

		if ( ! is_null( $sanitized->swift_signature_location ) && ! $sanitized->swift_signature_location instanceof Temp_Key_Location ) {
			add_settings_error(
				self::OPTION_NAME,
				'temp_url_key_location_input_error',
				__( 'Invalid temp-url-key location.', 'customer-data' )
			);
		} else {
			$signature_keys = $sanitized->get_signature_keys_from_swift();
			if ( is_wp_error( $signature_keys ) ) {
				add_settings_error(
					self::OPTION_NAME,
					'container_configuration_error',
					sprintf(
						/* translators: %s: Error message */
						__( 'Invalid container configuration: %s', 'customer-data' ),
						$signature_keys->get_error_message()
					)
				);
			} elseif ( ! is_null( $sanitized->swift_signature_location ) && ! $signature_keys->exists( $sanitized->swift_signature_location ) ) {
				add_settings_error(
					self::OPTION_NAME,
					'temp_url_key_location_error',
					__( 'Signature key not found in the metadatas', 'customer-data' )
				);
			}
		}

		$algos = $sanitized->get_available_algorithms();
		if ( is_wp_error( $algos ) ) {
			add_settings_error(
				self::OPTION_NAME,
				'algos_error',
				$algos->get_error_message()
			);
		} elseif ( ! in_array( $sanitized->swift_signature_hmac_algo, $algos, true ) ) {
			add_settings_error(
				self::OPTION_NAME,
				'algos_error',
				sprintf(
					// translators: %1$s: selected algorithm, %2$s: supported algorithms list.
					_n( 'Algorithm %1$s is not supported. The only supported algorithm is: %2$s.', 'Algorithm %1$s is not supported. The supported algorithms are: %2$s.', count( $algos ), 'customer-data' ),
					$sanitized->swift_signature_hmac_algo,
					implode( _x( ', ', 'list separator', 'customer-data' ), $algos )
				)
			);
		}

		return (array) $sanitized;
	}
}
