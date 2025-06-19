<?php
/**
 * Class Temp_Keys
 *
 * @package CustomerData
 */

namespace CustomerData;

use OpenStack\ObjectStore\v1\Service;
use WP_Error;

/**
 * Class Temp_Keys
 *
 * @package CustomerData
 */
class Temp_Keys extends \WP_List_Table {

	const SET_MAIN_ACTION = 'customer-data-set-main-temp-key';

	/**
	 * The signature keys.
	 *
	 * @var array
	 */
	protected $keys = array();

	/**
	 * Constructor.
	 *
	 * @param Service $object_store     The OpenStack Object Store service.
	 * @param string  $swift_container The Swift container name.
	 * @throws \Exception If the container does not exist.
	 */
	public function __construct( $object_store, $swift_container ) {
		parent::__construct(
			array(
				'singular' => _x( 'Key', 'temp keys table header', 'customer-data' ),
				'plural'   => _x( 'Keys', 'temp keys table header', 'customer-data' ),
				'ajax'     => true,
			)
		);

		$metadata = $object_store->getAccount()->getMetadata();

		if ( isset( $metadata['temp-url-key'] ) ) {
			$this->add_key( new Temp_Key_Location( Temp_Key_Location::CONTEXT_ACCOUNT, Temp_Key_Location::METADATA_KEY_1 ), $metadata['temp-url-key'] );
		}

		if ( isset( $metadata['temp-url-key-2'] ) ) {
			$this->add_key( new Temp_Key_Location( Temp_Key_Location::CONTEXT_ACCOUNT, Temp_Key_Location::METADATA_KEY_2 ), $metadata['temp-url-key-2'] );
		}

		if ( ! $object_store->containerExists( $swift_container ) ) {
			throw new \Exception(
				sprintf(
					/* translators: %s: Container name */
					esc_html__( 'Container %s does not exist.', 'customer-data' ),
					esc_html( $swift_container )
				)
			);
		}

		$metadata = $object_store->getContainer( $swift_container )->getMetadata();

		if ( isset( $metadata['temp-url-key'] ) ) {
			$this->add_key( new Temp_Key_Location( Temp_Key_Location::CONTEXT_CONTAINER, Temp_Key_Location::METADATA_KEY_1 ), $metadata['temp-url-key'] );
		}

		if ( isset( $metadata['temp-url-key-2'] ) ) {
			$this->add_key( new Temp_Key_Location( Temp_Key_Location::CONTEXT_CONTAINER, Temp_Key_Location::METADATA_KEY_2 ), $metadata['temp-url-key-2'] );
		}

		$this->_column_headers = array(
			array(
				'selector'     => '',
				'location'     => _x( 'Location', 'temp keys table header', 'customer-data' ),
				'context'      => _x( 'Context', 'temp keys table header', 'customer-data' ),
				'metadata_key' => _x( 'Metadata Key', 'temp keys table header', 'customer-data' ),
				'value'        => _x( 'Key', 'temp keys table header', 'customer-data' ),
			),
			array( 'location' ),
			array( 'context', 'metadata_key', 'value' ),
			'location',
		);
	}

	/**
	 * Register hooks
	 */
	public static function register_hooks() {
		add_action( 'admin_init', array( self::class, 'admin_init' ) );
		add_filter( 'customer_data_temp_keys_action_url', 'wp_nonce_url', 5, 2 );
	}

	/**
	 * Initialize admin hooks
	 */
	public static function admin_init() {
		add_action( 'admin_post_' . self::SET_MAIN_ACTION, array( self::class, 'admin_set_main_key' ) );
	}

	/**
	 * Handle setting the main key
	 */
	public static function admin_set_main_key() {
		if ( empty( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( $_REQUEST['_wpnonce'], self::SET_MAIN_ACTION ) ) {
			wp_die( esc_html__( 'Invalid nonce', 'customer-data' ), 400 );
			return;
		}

		if ( empty( $_REQUEST['location'] ) || ! is_array( $_REQUEST['location'] ) || empty( $_REQUEST['location']['location'] ) || empty( $_REQUEST['location']['metadata_key'] ) ) {
			wp_die( esc_html__( 'Invalid key location', 'customer-data' ), 400 );
			return;
		}

		$referer = wp_get_referer();
		if ( ! $referer ) {
			$referer = admin_url( 'options-general.php?page=' . Settings_Page::MENU_SLUG );
		}

		$options                           = Options::load();
		$options->swift_signature_location = new Temp_Key_Location(
			$_REQUEST['location']['location'],
			$_REQUEST['location']['metadata_key']
		);
		if ( ! $options->save() ) {
			$referer = add_query_arg( array( 'status' => 'no_changes' ), $referer );
		} else {
			$referer = add_query_arg( array( 'status' => 'success' ), $referer );
		}

		wp_safe_redirect( $referer );
	}

	/**
	 * Renders the default column.
	 *
	 * @param array  $item        The item to render the default column for.
	 * @param string $column_name The name of the column to render.
	 * @return string The HTML for the default column.
	 */
	public function column_default( $item, $column_name ) {
		return $this->is_main_key( $item ) ? '<strong>' . esc_html( $item[ $column_name ] ) . '</strong>' : esc_html( $item[ $column_name ] );
	}

	/**
	 * Renders the value column.
	 *
	 * @param array $item The item to render the value for.
	 * @return string The HTML for the value.
	 */
	public function column_value( $item ) {
		return '<div class="customer-data-secret">' .
			'<span class="placeholder dashicons dashicons-hidden"></span><code class="placeholder">' . esc_html_x( '********', 'placeholder for temp key value', 'customer-data' ) . '</code>' .
			'<span class="value dashicons dashicons-visibility"></span><code class="value">' . esc_html( $item['value'] ) . '</code>' .
			'</div>';
	}

	/**
	 * Renders the selector column.
	 *
	 * @param array $item The item to render the selector for.
	 * @return string The HTML for the selector.
	 */
	public function column_selector( $item ) {
		return '<input type="radio" ' . checked( $this->is_main_key( $item ), true, false ) . ' name="' . esc_attr( Options::OPTION_NAME . '[swift_signature_location]' ) . '" value="' . esc_attr( $item['location'] ) . '" />';
	}

	/**
	 * Prepares the items for display.
	 */
	public function prepare_items() {
		foreach ( $this->keys as $context => $keys_in_context ) {
			foreach ( $keys_in_context as $metadata_key => $key ) {
				$this->items[] = array(
					'location'     => new Temp_Key_Location( $context, $metadata_key ),
					'context'      => Temp_Key_Location::CONTEXT_CONTAINER === $context ? _x( 'Container', 'temp keys table cell', 'customer-data' ) : _x( 'Account', 'temp keys table cell', 'customer-data' ),
					'metadata_key' => Temp_Key_Location::METADATA_KEY_1 === $metadata_key ? _x( 'Key 1', 'temp keys table cell', 'customer-data' ) : _x( 'Key 2', 'temp keys table cell', 'customer-data' ),
					'value'        => $key,
				);
			}
		}
	}

	/**
	 * Handles the row actions.
	 *
	 * @param array  $item        The item to handle the actions for.
	 * @param string $column_name The name of the column to handle the actions for.
	 * @param bool   $primary     Whether the item is the primary item.
	 * @return string The HTML for the row actions.
	 */
	public function handle_row_actions( $item, $column_name, $primary ) {
		$actions = array();

		if ( 'context' === $column_name ) {
			if ( ! $this->is_main_key( $item ) ) {
				$actions[ self::SET_MAIN_ACTION ] = '<a href="' . esc_attr(
					apply_filters(
						'customer_data_temp_keys_action_url',
						add_query_arg(
							array(
								'action'   => self::SET_MAIN_ACTION,
								'location' => $item['location'],
								'_wpnonce' => wp_create_nonce( self::SET_MAIN_ACTION ),
							),
							admin_url( 'admin-post.php' )
						),
						self::SET_MAIN_ACTION,
						$item
					)
				) . '">' . __( 'Set Main', 'customer-data' ) . '</a>';
			}
		}

		return $this->row_actions( $actions ) . parent::handle_row_actions( $item, $column_name, $primary );
	}

	/**
	 * Checks if a key is the main key.
	 *
	 * @param array $item The item to check.
	 * @return bool True if the key is the main key, false otherwise.
	 */
	public function is_main_key( array $item ) {
		$options  = Options::load();
		$location = $item['location'];
		return ! is_null( $options->swift_signature_location ) && $options->swift_signature_location->location === $location->location && $options->swift_signature_location->metadata_key === $location->metadata_key;
	}

	/**
	 * Message to be displayed when there are no items
	 *
	 * @since 3.1.0
	 */
	public function no_items() {
		esc_html_e( 'No keys found. Please add a key to the container or account and refresh the page.', 'customer-data' );
	}

	/**
	 * Displays the table navigation.
	 *
	 * Overrides the default display method to remove the bulk actions.
	 *
	 * @param string $which The location of the table navigation.
	 */
	protected function display_tablenav( $which ) {}

	/**
	 * Adds a key for a given location.
	 *
	 * @param Temp_Key_Location $location The location to add the key for.
	 * @param string            $key      The key to add.
	 */
	public function add_key( Temp_Key_Location $location, string $key ) {
		if ( ! isset( $this->keys[ $location->location ] ) ) {
			$this->keys[ $location->location ] = array();
		}

		$this->keys[ $location->location ][ $location->metadata_key ] = $key;
	}

	/**
	 * Returns the key for a given location.
	 *
	 * @param Temp_Key_Location $location The location to get the key for.
	 * @return string|WP_Error The key or a WP_Error if the key is not found.
	 */
	public function get_key( Temp_Key_Location $location ) {
		if ( isset( $this->keys[ $location->location ][ $location->metadata_key ] ) ) {
			return $this->keys[ $location->location ][ $location->metadata_key ];
		}

		return new WP_Error( 'key_not_found', 'Key not found' );
	}

	/**
	 * Returns the default location.
	 *
	 * @return Temp_Key_Location|WP_Error The default location or a WP_Error if no key is found.
	 */
	public function default_location() {
		$priority = array(
			new Temp_Key_Location( Temp_Key_Location::CONTEXT_CONTAINER, Temp_Key_Location::METADATA_KEY_1 ),
			new Temp_Key_Location( Temp_Key_Location::CONTEXT_CONTAINER, Temp_Key_Location::METADATA_KEY_2 ),
			new Temp_Key_Location( Temp_Key_Location::CONTEXT_ACCOUNT, Temp_Key_Location::METADATA_KEY_1 ),
			new Temp_Key_Location( Temp_Key_Location::CONTEXT_ACCOUNT, Temp_Key_Location::METADATA_KEY_2 ),
		);

		foreach ( $priority as $location ) {
			$key = $this->get_key( $location );
			if ( ! is_wp_error( $key ) ) {
				return $location;
			}
		}

		return new WP_Error( 'no_key_found', 'No key found' );
	}

	/**
	 * Returns the key location or the default location if the key is not found.
	 *
	 * @param Temp_Key_Location|null $location The location to check.
	 * @return Temp_Key_Location|WP_Error The key location or a WP_Error if no key is found.
	 */
	public function key_location_or_default( $location ) {
		if ( ! is_null( $location ) ) {
			$key = $this->get_key( $location );
			if ( ! is_wp_error( $key ) ) {
				return $location;
			}
		}

		return $this->default_location();
	}

	/**
	 * Returns all locations with their metadata keys.
	 *
	 * @return Temp_Key_Location[] An array of Temp_Key_Location objects.
	 */
	public function all_locations() {
		$locations = array();
		foreach ( $this->keys as $location => $keys ) {
			foreach ( $keys as $metadata_key => $key ) {
				$locations[] = new Temp_Key_Location( $location, $metadata_key );
			}
		}

		return $locations;
	}

	/**
	 * Checks if a key exists for a given location.
	 *
	 * @param Temp_Key_Location|null $location The location to check.
	 * @return bool True if the key exists, false otherwise.
	 */
	public function exists( $location ) {
		$key = $this->get_key( $location );
		if ( is_wp_error( $key ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Returns the number of keys.
	 *
	 * @return int The number of keys.
	 */
	public function count() {
		return count( $this->keys );
	}

	/**
	 * Get the columns.
	 *
	 * @return array Empty array, so columns are not configurable.
	 */
	public function get_columns() {
		return array();
	}
}
