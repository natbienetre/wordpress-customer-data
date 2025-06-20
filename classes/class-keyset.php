<?php
/**
 * KeySet class
 *
 * @package CustomerData
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace CustomerData;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Exception;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Jose\Component\Core\AlgorithmManager;
use Jose\Component\Signature\Algorithm\EdDSA;
use Jose\Component\Signature\JWSBuilder;
use Jose\Component\Signature\Serializer\CompactSerializer;
use Jose\Component\Core\JWKSet;
use Jose\Component\KeyManagement\JWKFactory;

if ( ! class_exists( '\WP_List_Table' ) ) {
	require_once ABSPATH . 'wp-admin/includes/admin.php';
}

/**
 * Class Keyset
 *
 * @since 1.0.0
 */
class Keyset extends \WP_List_Table {

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
	protected $rest_base = '/jwks';

	/**
	 * Option name for storing keys
	 *
	 * @var string
	 */
	public const OPTION_NAME = 'customer_data_keys';

	/**
	 * Key algorithm
	 *
	 * @var string
	 */
	public const KEY_ALGORITHM = 'EdDSA';

	/**
	 * Key curve
	 *
	 * @var string
	 */
	public const KEY_CURVE = 'Ed25519';

	/**
	 * Action unique id for setting the main key
	 *
	 * @var string
	 */
	public const SET_MAIN_ACTION = 'customer-data-set-main-jwk';

	/**
	 * Action unique id for creating a new key
	 *
	 * @var string
	 */
	public const CREATE_ACTION = 'customer-data-create-jwk';

	/**
	 * Action unique id for deleting a key
	 *
	 * @var string
	 */
	public const DELETE_ACTION = 'customer-data-delete-jwk';

	/**
	 * JWK Set instance
	 *
	 * @var JWKSet
	 */
	public JWKSet $keys;

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct(
			array(
				'singular' => _x( 'Key', 'keyset table header', 'customer-data' ),
				'plural'   => _x( 'Keys', 'keyset table header', 'customer-data' ),
				'ajax'     => true,
			)
		);

		$this->keys            = new JWKSet( keys: get_option( self::OPTION_NAME, array() ) );
		$this->_column_headers = array(
			array(
				'selector'   => '',
				'key_id'     => _x( 'Key ID', 'keyset table header', 'customer-data' ),
				'public_key' => _x( 'Public Key', 'keyset table header', 'customer-data' ),
				'algorithm'  => _x( 'Algorithm', 'keyset table header', 'customer-data' ),
				'curve'      => _x( 'Curve', 'keyset table header', 'customer-data' ),
				'key_type'   => _x( 'Key Type', 'keyset table header', 'customer-data' ),
			),
			array( 'key_id' ),
			array( 'public_key', 'algorithm', 'curve', 'key_type' ),
			'key_id',
		);
	}

	/**
	 * Register hooks
	 */
	public static function register_hooks() {
		add_action( 'init', array( self::class, 'init' ) );
		add_action( 'admin_init', array( self::class, 'admin_init' ) );
		add_filter( 'customer_data_keyset_action_url', 'wp_nonce_url', 5, 2 );
	}

	/**
	 * Initialize the keyset admin.
	 */
	public static function admin_init() {
		$instance = new self();

		add_action( 'admin_post_' . self::CREATE_ACTION, array( $instance, 'admin_create_key' ) );
		add_action( 'admin_post_' . self::DELETE_ACTION, array( $instance, 'admin_delete_key' ) );
		add_action( 'admin_post_' . self::SET_MAIN_ACTION, array( self::class, 'admin_set_main_key' ) );
	}

	/**
	 * Initialize the keyset.
	 */
	public static function init() {
		$instance = new self();
		add_action( 'rest_api_init', array( $instance, 'rest_api_init' ) );
	}

	/**
	 * Delete a key.
	 */
	public function admin_delete_key() {
		if ( ! isset( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( $_REQUEST['_wpnonce'], self::DELETE_ACTION ) ) {
			wp_die( esc_html__( 'Invalid nonce', 'customer-data' ), 400 );
			return;
		}

		if ( ! isset( $_REQUEST['key'] ) ) {
			wp_die( esc_html__( 'No key provided', 'customer-data' ), 400 );
			return;
		}

		$key_id = $_REQUEST['key'];

		$this->delete_key( $key_id );
		$this->save();

		$referer = wp_get_referer();
		if ( ! $referer ) {
			$referer = admin_url( 'options-general.php?page=customer-data-keyset' );
		}

		wp_safe_redirect( $referer );
	}

	/**
	 * Create a new key.
	 */
	public function admin_create_key() {
		if ( ! isset( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( $_REQUEST['_wpnonce'], self::CREATE_ACTION ) ) {
			wp_die( esc_html__( 'Invalid nonce', 'customer-data' ), 400 );
			return;
		}

		$this->new_key();
		$this->save();

		$referer = wp_get_referer();
		if ( ! $referer ) {
			$referer = admin_url( 'options-general.php?page=customer-data-keyset' );
		}

		wp_safe_redirect( $referer );
	}

	/**
	 * Set the main key.
	 */
	public static function admin_set_main_key() {
		if ( ! isset( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( $_REQUEST['_wpnonce'], self::SET_MAIN_ACTION ) ) {
			wp_die( esc_html__( 'Invalid nonce', 'customer-data' ), 400 );
			return;
		}

		$referer = wp_get_referer();
		if ( ! $referer ) {
			$referer = admin_url( 'options-general.php?page=customer-data-keyset' );
		}

		if ( ! isset( $_REQUEST['key'] ) ) {
			wp_die( esc_html__( 'No key provided', 'customer-data' ), 400 );
			return;
		}

		$options                           = Options::load();
		$options->key_management->main_key = $_REQUEST['key'];
		if ( ! $options->save() ) {
			$referer = add_query_arg( array( 'status' => 'no_changes' ), $referer );
		} else {
			$referer = add_query_arg( array( 'status' => 'success' ), $referer );
		}

		wp_safe_redirect( $referer );
	}

	/**
	 * Prepare items for display
	 */
	public function prepare_items() {
		$this->items = array_map(
			function ( int|string $index ) {
				$key        = $this->keys->get( $index );
				$public_key = $key->toPublic();

				return array(
					'key_id'     => $key->has( key: 'kid' ) ? $key->get( 'kid' ) : (string) $index,
					'public_key' => $public_key->get( 'x' ),
					'algorithm'  => $key->get( 'alg' ),
					'curve'      => $key->get( 'crv' ),
					'key_type'   => $key->get( 'kty' ),
				);
			},
			array_keys( $this->keys->all() )
		);
	}

	/**
	 * Display the no items message.
	 */
	public function no_items() {
		esc_html_e( 'No keys found. Please create your first key.', 'customer-data' );
	}

	/**
	 * Get the columns.
	 *
	 * @return array Empty array, so columns are not configurable.
	 */
	public function get_columns() {
		return array();
	}

	/**
	 * Display the default column.
	 *
	 * @param array  $item The item.
	 * @param string $column_name The column name.
	 * @return string The default column.
	 */
	public function column_default( $item, $column_name ) {
		return $this->is_main_key( $item ) ? '<strong>' . $item[ $column_name ] . '</strong>' : $item[ $column_name ];
	}

	/**
	 * Display the selector column.
	 *
	 * @param array $item The item.
	 * @return string The selector column.
	 */
	public function column_selector( $item ) {
		return '<input type="radio" ' . checked( $this->is_main_key( $item ), true, false ) . ' name="' . esc_attr( Options::OPTION_NAME . '[key_management][main_key]' ) . '" value="' . esc_attr( $item['key_id'] ) . '" />';
	}

	/**
	 * Handle row actions
	 *
	 * @param array  $item The item.
	 * @param string $column_name The column name.
	 * @param string $primary The primary column name.
	 * @return string The row actions.
	 */
	public function handle_row_actions( $item, $column_name, $primary ) {
		$actions = array();

		if ( 'public_key' === $column_name ) {
			if ( ! $this->is_main_key( $item ) ) {
				$actions[ self::SET_MAIN_ACTION ] = '<a href="' . esc_attr(
					apply_filters(
						'customer_data_keyset_action_url',
						add_query_arg(
							array(
								'action'   => self::SET_MAIN_ACTION,
								'key'      => $item['key_id'],
								'_wpnonce' => wp_create_nonce( self::SET_MAIN_ACTION ),
							),
							admin_url( 'admin-post.php' )
						),
						self::SET_MAIN_ACTION,
						$item
					)
				) . '">' . __( 'Set Main', 'customer-data' ) . '</a>';
				$actions['delete']                = '<a href="' . esc_attr(
					apply_filters(
						'customer_data_keyset_action_url',
						add_query_arg(
							array(
								'action'   => self::DELETE_ACTION,
								'key'      => $item['key_id'],
								'_wpnonce' => wp_create_nonce( self::DELETE_ACTION ),
							),
							admin_url( 'admin-post.php' )
						),
						self::DELETE_ACTION,
						$item
					)
				) . '">' . __( 'Delete', 'customer-data' ) . '</a>';
			}
		}

		return $this->row_actions( $actions ) . parent::handle_row_actions( $item, $column_name, $primary );
	}

	/**
	 * Displays the table navigation.
	 *
	 * Overrides the default display method to remove the bulk actions.
	 *
	 * @param string $which The location of the table navigation.
	 */
	protected function display_tablenav( $which ) {
		if ( 'top' === $which ) {
			return;
		}

		?>
		<div class="tablenav <?php echo esc_attr( $which ); ?>">
			<div class="alignleft actions bulkactions">
				<a
					href="
					<?php
					echo esc_url(
						add_query_arg(
							array(
								'action'           => self::CREATE_ACTION,
								'_wpnonce'         => wp_create_nonce( self::CREATE_ACTION ),
								'_wp_http_referer' => rawurlencode( remove_query_arg( array( 'action', '_wpnonce' ), $_SERVER['REQUEST_URI'] ) ),
							),
							admin_url( 'admin-post.php' )
						)
					);
					?>
					"
					class="button"
				><?php esc_html_e( 'Create a new key', 'customer-data' ); ?></a>
			</div>
		</div>
		<?php
	}

	/**
	 * Save keys to database
	 */
	public function save() {
		update_option( self::OPTION_NAME, $this->keys->all() );
	}

	/**
	 * Delete a key by ID
	 *
	 * @param string $key_id Key ID.
	 * @return bool
	 */
	public function delete_key( string $key_id ) {
		foreach ( $this->keys as $index => $key ) {
			if ( $key->has( 'x' ) && $key->get( 'x' ) === $key_id ) {
				$this->keys = $this->keys->without( $index );

				return true;
			}
		}

		if ( ! $this->keys->has( $key_id ) ) {
			return false;
		}

		$this->keys = $this->keys->without( $key_id );

		return true;
	}

	/**
	 * Check if a key is the main key
	 *
	 * @param array $item The item.
	 * @return bool
	 */
	public function is_main_key( array $item ) {
		$options = Options::load();
		return $options->key_management->main_key === $item['key_id'];
	}

	/**
	 * Get a key by ID
	 *
	 * @param string $key_id Key ID.
	 * @return mixed
	 */
	public function get_key( string $key_id ) {
		foreach ( $this->keys as $index => $key ) {
			if ( $key->has( 'x' ) && $key->get( 'x' ) === $key_id ) {
				$this->keys = $this->keys->without( $index );

				return true;
			}
		}
		try {
			return $this->keys->get( $key_id );
		} catch ( Exception $e ) {
			return false;
		}
	}

	/**
	 * Get default key values
	 *
	 * @return array
	 */
	protected static function values() {
		return array(
			'alg' => self::KEY_ALGORITHM,
			'use' => 'sig',
			'kid' => wp_generate_uuid4(),
		);
	}

	/**
	 * Create a new key
	 *
	 * @return mixed
	 */
	protected function new_key() {
		$key = JWKFactory::createOKPKey( self::KEY_CURVE, self::values() );

		$this->keys = $this->keys->with( $key );

		return $key;
	}

	/**
	 * Check if a given request has access to create items
	 *
	 * @return WP_Error|bool
	 */
	public function create_item_permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Handle the JWKS POST request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function create_item() {
		$key = $this->new_key();

		$this->save();

		return new WP_REST_Response( $key->toPublic(), 201 );
	}

	/**
	 * Check if a given request has access to get items
	 *
	 * @return WP_Error|bool
	 */
	public function get_items_permissions_check() {
		return true;
	}

	/**
	 * Handle the JWKS GET request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_items() {
		return new WP_REST_Response( $this->get_public_keyset() );
	}

	/**
	 * Check if a given request has access to get items
	 *
	 * @return WP_Error|bool
	 */
	public function delete_item_permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Handle the JWKS DELETE request
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_Error|WP_REST_Response
	 */
	public function delete_item( $request ) {
		if ( ! $request->has_param( 'key' ) ) {
			return new WP_Error(
				'no_key',
				__( 'No key provided', 'customer-data' ),
				array( 'status' => 400 )
			);
		}

		$id = $request->get_param( 'key' );

		if ( ! $this->delete_key( $id ) ) {
			return new WP_Error(
				'not_found',
				sprintf(
					/* translators: %s: Key ID */
					__( 'Key not found: %s', 'customer-data' ),
					$id
				),
				array( 'status' => 404 )
			);
		}

		$this->save();

		return new WP_REST_Response( null, 204 );
	}

	/**
	 * Check if a given request has access to sign items
	 *
	 * @return WP_Error|bool
	 */
	public function sign_item_permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Handle the JWKS SIGN request
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_Error|WP_REST_Response
	 */
	public function sign_item( $request ) {
		if ( empty( $this->keys ) ) {
			return new WP_Error(
				'no_keys',
				__( 'No keys found', 'customer-data' ),
				array( 'status' => 400 )
			);
		}

		$request_body = json_decode( $request->get_body(), true );

		return new WP_REST_Response( $this->sign( $request_body ), 200 );
	}

	/**
	 * Sign an item
	 *
	 * @param array $item The item to sign.
	 * @return WP_Error|array
	 */
	public function sign( $item ) {
		$algorithm_manager = new AlgorithmManager(
			array(
				new EdDSA(),
			)
		);

		if ( empty( $this->keys ) ) {
			return new WP_Error(
				'no_keys',
				__( 'No keys found', 'customer-data' ),
				array( 'status' => 400 )
			);
		}

		if ( empty( $item['key'] ) ) {
			$options = Options::load();
			$key     = $this->get_key( key_id: $options->key_management->main_key );
			if ( ! $key ) {
				$key = $this->keys->selectKey( 'sig' );
				if ( ! $key ) {
					return new WP_Error( 'no_key_found', __( 'No valid key found', 'customer-data' ) );
				}
			}
		} else {
			$key = $this->get_key( $item['key'] );
			if ( ! $key ) {
				return new WP_Error(
					'no_key_found',
					sprintf(
						/* translators: %s: Key ID */
						__( 'No key found for %s', 'customer-data' ),
						$item['key']
					),
					array( 'status' => 400 )
				);
			}
		}

		if ( empty( $item['payload'] ) ) {
			return new WP_Error(
				'no_payload',
				__( 'No payload provided', 'customer-data' ),
				array( 'status' => 400 )
			);
		}

		$payload     = $item['payload'];
		$jws_builder = new JWSBuilder( $algorithm_manager );

		try {
			$jws = $jws_builder
				->create()
				->withPayload( is_string( $payload ) ? $payload : wp_json_encode( $payload ) )
				->addSignature( $key, protectedHeader: array( 'alg' => $key->get( 'alg' ) ) )
				->build();
		} catch ( Exception $e ) {
			return new WP_Error(
				'sign_error',
				$e->getMessage(),
				array(
					'status' => 400,
					'key'    => $key->toPublic(),
				)
			);
		}

		$serializer = new CompactSerializer();

		return array(
			'token' => $serializer->serialize( $jws ),
			'key'   => $key->toPublic(),
		);
	}

	/**
	 * Register REST API routes
	 */
	public function register_routes() {
		$options = Options::load();

		if ( $options->key_management->enabled ) {
			register_rest_route(
				$this->namespace,
				'/' . $this->rest_base,
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'schema'              => array( $this, 'get_items_schema' ),
				)
			);

			register_rest_route(
				$this->namespace,
				'/' . $this->rest_base,
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'schema'              => array( $this, 'create_item_schema' ),
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				)
			);

			register_rest_route(
				$this->namespace,
				'/' . $this->rest_base . '/(?P<key>[^/]+)',
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'schema'              => array( $this, 'delete_item_schema' ),
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				)
			);

			register_rest_route(
				$this->namespace,
				'/' . $this->rest_base . '/sign',
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'schema'              => array( $this, 'sign_item_schema' ),
					'callback'            => array( $this, 'sign_item' ),
					'permission_callback' => array( $this, 'sign_item_permissions_check' ),
				)
			);
		}
	}

	/**
	 * Get items schema
	 *
	 * @return array
	 */
	public function get_items_schema() {
		return array(
			'schema'     => 'http://json-schema.org/draft-04/schema#',
			'properties' => array(
				'keys' => array(
					'type'       => 'array',
					'properties' => array(
						'x'   => array( 'type' => 'string' ),
						'alg' => array( 'type' => 'string' ),
						'crv' => array( 'type' => 'string' ),
						'kty' => array( 'type' => 'string' ),
					),
				),
			),
		);
	}

	/**
	 * Get create item schema
	 *
	 * @return array
	 */
	public function create_item_schema() {
		return array(
			'schema'     => 'http://json-schema.org/draft-04/schema#',
			'properties' => array(
				'type' => 'object',
			),
		);
	}

	/**
	 * Get delete item schema
	 *
	 * @return array
	 */
	public function delete_item_schema() {
		return array(
			'schema' => 'http://json-schema.org/draft-04/schema#',
		);
	}

	/**
	 * Get sign item schema
	 *
	 * @return array
	 */
	public function sign_item_schema() {
		return array(
			'schema'     => 'http://json-schema.org/draft-04/schema#',
			'properties' => array(
				'payload' => array(
					'type'     => 'string',
					'required' => true,
				),
				'key'     => array( 'type' => 'string' ),
			),
		);
	}

	/**
	 * Initialize REST API
	 */
	public function rest_api_init() {
		$this->register_routes();
	}

	/**
	 * Get the public keyset
	 *
	 * @return JWKSet
	 */
	public function get_public_keyset() {
		return new JWKSet(
			array_map(
				function ( $key ) {
					return $key->toPublic();
				},
				$this->keys->all()
			)
		);
	}
}
