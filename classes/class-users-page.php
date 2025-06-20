<?php
/**
 * Users page
 *
 * @package CustomerData
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace CustomerData;

use WP_Error;

/**
 * Users page
 *
 * @package CustomerData
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */
class Users_Page {
	public const SHOW_RESULT_ACTION  = 'customer-data-show-token-result';
	public const CREATE_TOKEN_ACTION = 'customer-data-create-token-quick';

	/**
	 * Create token tool
	 *
	 * @var Tool_Create_Token
	 */
	private $create_token_tool;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->create_token_tool = new Tool_Create_Token();
	}

	/**
	 * Register hooks
	 */
	public static function register_hooks() {
		$instance = new self();

		add_filter( 'user_row_actions', array( self::class, 'user_row_actions' ), 10, 2 );
		add_action( 'load-users.php', array( $instance, 'get_result' ) );
		add_action( 'admin_post_' . self::CREATE_TOKEN_ACTION, array( $instance, 'load' ) );
		add_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_admin_script' ) );
	}

	/**
	 * Enqueue admin scripts
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page.
	 * @return void
	 */
	public function enqueue_admin_script( $hook ) {
		if ( 'users.php' !== $hook ) {
			return;
		}

		$this->create_token_tool->enqueue_admin_script();
	}

	/**
	 * Get the result
	 */
	public function get_result() {
		if ( ! isset( $_REQUEST['action'] ) || self::SHOW_RESULT_ACTION !== $_REQUEST['action'] ) {
			return;
		}

		if ( ! empty( $_REQUEST['result'] ) ) {
			$this->create_token_tool->result = json_decode( urldecode( $_REQUEST['result'] ), true );
		} elseif ( ! empty( $_REQUEST['error'] ) ) {
			$this->create_token_tool->result = new WP_Error( 'customer-data-token-creation-error', urldecode( $_REQUEST['error'] ) );
		}

		add_action( 'admin_notices', array( $this, 'render_result' ) );
	}

	/**
	 * Load the tool
	 */
	public function load() {
		if ( ! isset( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( $_REQUEST['_wpnonce'], self::CREATE_TOKEN_ACTION ) ) {
			// translators: %s is the action name.
			wp_die( sprintf( __( 'Invalid nonce for action <i>%s</i>', 'customer-data' ), esc_html( self::CREATE_TOKEN_ACTION ) ), 400 );
			return;
		}

		$this->create_token_tool->action();

		$referer = wp_get_referer();
		if ( ! $referer ) {
			$referer = admin_url( 'users.php' );
		}

		$referer = add_query_arg(
			array(
				'action' => self::SHOW_RESULT_ACTION,
			),
			$referer
		);

		if ( is_wp_error( $this->create_token_tool->result ) ) {
			$referer = add_query_arg(
				array(
					'error' => urlencode( $this->create_token_tool->result->get_error_message() ),
				),
				$referer
			);
		} else {
			$referer = add_query_arg(
				array(
					'result' => urlencode( json_encode( $this->create_token_tool->result ) ),
				),
				$referer
			);
		}

		wp_safe_redirect( $referer );
	}

	/**
	 * Render the result
	 */
	public function render_result() {
		?>
		<div
			data-wp-interactive="<?php echo esc_attr( Tool_Create_Token::INTERACTIVITY_STORE_NAMESPACE ); ?>"
			<?php echo wp_interactivity_data_wp_context( $this->create_token_tool->interactivity_context() ); ?>
		>
		<?php $this->create_token_tool->render_result( false ); ?>
		</div>
		<?php
	}

	/**
	 * Add a link to create a token for the user
	 *
	 * @param array    $actions User row actions.
	 * @param \WP_User $user_object User object.
	 * @return array
	 */
	public static function user_row_actions( $actions, $user_object ) {
		$query              = add_query_arg(
			array(
				'action'                                  => self::CREATE_TOKEN_ACTION,
				'customer-data-token-creation-user-id'    => $user_object->user_login,
				'customer-data-token-creation-expires-at' => gmdate( 'Y-m-d', time() + 3600 * 24 * 365 ),
				'customer-data-token-creation-display-name' => $user_object->display_name,
				'customer-data-token-creation-email'      => $user_object->user_email,
				'customer-data-token-creation-scope'      => '',
				'_wpnonce'                                => wp_create_nonce( self::CREATE_TOKEN_ACTION ),
				'_wp_http_referer'                        => remove_query_arg(
					array(
						'action',
						'result',
					),
					remove_query_arg( wp_removable_query_args(), wp_slash( $_SERVER['REQUEST_URI'] ) )
				),
			),
			admin_url( 'admin-post.php' ),
		);
		$create_read_token  = esc_url( add_query_arg( 'customer-data-token-creation-permissions-read', 'on', $query ) );
		$create_write_token = esc_url( add_query_arg( 'customer-data-token-creation-permissions-write', 'on', $query ) );
		$create_full_token  = esc_url(
			add_query_arg(
				array(
					'customer-data-token-creation-permissions-read'  => 'on',
					'customer-data-token-creation-permissions-write' => 'on',
				),
				$query
			)
		);
		// translators: %1$s: URL to create a read token, %2$s: URL to create a write token, %3$s: URL to create a full token.
		$actions['customer_data_token'] = sprintf( __( 'New <a href="%1$s">read</a>, <a href="%2$s">write</a> or <a href="%3$s">full token</a>', 'customer-data' ), $create_read_token, $create_write_token, $create_full_token );
		return $actions;
	}
}
