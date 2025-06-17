<?php
/**
 * Admin page class
 *
 * @package VFS
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace VFS;

use DateTime;
use WP_Error;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class Tool_Create_Token
 *
 * @since 1.0.0
 */
class Tool_Create_Token {

	/**
	 * Admin settings script and style handle
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SCRIPT_HANDLE = 'vfs-tool-create-token';

	/**
	 * Interactivity store namespace
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const INTERACTIVITY_STORE_NAMESPACE = 'vfs-admin-tools-token-creation';

	/**
	 * Action name
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const ACTION_NAME = 'vfs-create-token';

	/**
	 * Load hook suffix
	 *
	 * @var string
	 */
	private $load_hook_suffix;

	/**
	 * Result
	 *
	 * @var array|null|\WP_Error
	 */
	public $result = null;

	/**
	 * Register hooks
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_hooks() {
		add_action( 'admin_enqueue_scripts', array( self::class, 'register_admin_script' ) );
		add_action( 'rest_api_init', array( self::class, 'rest_api_init' ) );
	}

	/**
	 * Register the admin script
	 */
	public static function register_admin_script() {
		$err = Scripts::register_with_assets( self::SCRIPT_HANDLE, 'admin-settings/tool-create-token-interactivity.asset.php' );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}

		$err = Scripts::register_with_assets( self::SCRIPT_HANDLE, 'admin-settings/tool-create-token.asset.php', true, array() );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}
	}

	/**
	 * Enqueue the admin script
	 */
	public function enqueue_admin_script() {
		Scripts::enqueue_style( self::SCRIPT_HANDLE );

		$err = Scripts::enqueue_script( self::SCRIPT_HANDLE, 'admin-settings/tool-create-token-interactivity.asset.php' );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}

		$err = Scripts::enqueue_script( self::SCRIPT_HANDLE, 'admin-settings/tool-create-token.asset.php' );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}
	}

	/**
	 * Load the tool
	 */
	public function load() {
		if ( ! isset( $_REQUEST['action'] ) || self::ACTION_NAME !== $_REQUEST['action'] ) {
			return;
		}

		if ( ! isset( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( $_REQUEST['_wpnonce'], self::ACTION_NAME ) ) {
			$this->result = new \WP_Error( 'invalid_nonce', __( 'Invalid nonce. Please try again.', 'vfs' ) );
			return;
		}

		if ( ! current_user_can( 'create_users' ) ) {
			$this->result = new \WP_Error( 'insufficient_permissions', __( 'You are not allowed to create tokens.', 'vfs' ) );
			return;
		}

		$this->action();
	}

	public const DEFAULT_EXPIRATION_DATE = '+1 year';

	/**
	 * Action
	 */
	public function action() {
		$this->result = $this->create_token(
			$this->get_user_id( $_REQUEST ),
			isset( $_REQUEST['vfs-token-creation-permissions-read'] ),
			isset( $_REQUEST['vfs-token-creation-permissions-write'] ),
			isset( $_REQUEST['vfs-token-creation-expires-at'] ) ? DateTime::createFromFormat( 'Y-m-d', $_REQUEST['vfs-token-creation-expires-at'] ) : null,
			$_REQUEST['vfs-token-creation-display-name'] ?? '',
			$_REQUEST['vfs-token-creation-email'] ?? '',
			$_REQUEST['vfs-token-creation-scope'] ?? '',
		);
	}

	/**
	 * Create a token
	 *
	 * @param string        $user_id User ID.
	 * @param bool          $read_permissions Read permissions.
	 * @param bool          $write_permissions Write permissions.
	 * @param DateTime|null $expires_at Expires at.
	 * @param string        $display_name Display name.
	 * @param string        $email Email.
	 * @param string        $page_space Page space.
	 * @return array|WP_Error Token or error.
	 */
	public function create_token( $user_id, $read_permissions, $write_permissions, $expires_at, $display_name, $email, $page_space ) {
		$key_set   = new KeySet();
		$swift_api = new Swift_API();

		$methods = array();

		if ( $read_permissions ) {
			$methods = array_merge( $methods, apply_filters( 'vfs_swift_api_read_http_methods', array( 'GET' ) ) );
		}
		if ( $write_permissions ) {
			$methods = array_merge( $methods, apply_filters( 'vfs_swift_api_write_http_methods', array( 'PUT', 'DELETE' ) ) );
		}

		if ( is_null( $expires_at ) ) {
			$expires_at = new DateTime( self::DEFAULT_EXPIRATION_DATE );
		}

		$signatures = array();

		foreach ( $methods as $method ) {
			$signature_result = $swift_api->generate_signature(
				$user_id,
				$method,
				$expires_at,
			);
			if ( is_wp_error( $signature_result ) ) {
				return $signature_result;
			}
			$signatures[ $method ] = $signature_result['signature'];
		}

		return $key_set->sign(
			array(
				'payload' => array(
					'version' => '1',
					'user'    => array(
						'id'          => $user_id,
						'displayName' => $display_name,
						'email'       => $email,
					),
					'swift'   => array(
						'expiresAt'  => $expires_at->getTimestamp(),
						'pageSpace'  => $page_space,
						'signatures' => $signatures,
					),
				),
			)
		);
	}

	/**
	 * Initialize REST API
	 */
	public static function rest_api_init() {
		$tool = new self();
		$tool->register_routes();
	}

	/**
	 * Register REST API routes
	 */
	public function register_routes() {
		register_rest_route(
			Api::NAMESPACE,
			'/tokens',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle_create_token' ),
				'permission_callback' => array( self::class, 'create_token_permissions_check' ),
				'schema'              => array( self::class, 'create_token_schema' ),
			)
		);
	}

	/**
	 * Create a token
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response Response.
	 */
	public function handle_create_token( $request ) {
		$body = json_decode( $request->get_body(), true );

		if ( ! isset( $body['user']['id'] ) ) {
			return new WP_REST_Response(
				new WP_Error( 'invalid_user_id', __( 'user ID is required', 'vfs' ) ),
				400
			);
		}

		$user_id      = $body['user']['id'];
		$user_email   = $body['user']['email'] ?? '';
		$display_name = $body['user']['displayName'] ?? $user_email;

		if ( empty( $display_name ) ) {
			$display_name = $user_id;
		}

		$expires_at = isset( $body['expiresAt'] ) ? DateTime::createFromFormat( 'Y-m-d', $body['expiresAt'] ) : null;
		$page_space = $body['scope'] ?? '';

		$result = $this->create_token(
			$user_id,
			isset( $body['permissions'] ) && in_array( 'read', $body['permissions'], true ),
			isset( $body['permissions'] ) && in_array( 'write', $body['permissions'], true ),
			$expires_at,
			$display_name,
			$user_email,
			$page_space
		);

		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				$result,
				500
			);
		}

		return new WP_REST_Response(
			data: $result,
			status: 200,
		);
	}

	/**
	 * Create token permissions check
	 */
	public static function create_token_permissions_check() {
		return current_user_can( 'create_users' );
	}

	/**
	 * Create token schema
	 */
	public static function create_token_schema() {
		return array( 'type' => 'object' );
	}

	/**
	 * Interactivity context
	 *
	 * @return array
	 */
	public function interactivity_context() {
		$options = Options::load();
		wp_interactivity_state(
			self::INTERACTIVITY_STORE_NAMESPACE,
			array(
				'suffix'                 => $options->swift_additional_prefix,
				'readPermissionMethods'  => apply_filters( 'vfs_swift_api_read_http_methods', array( 'GET' ) ),
				'writePermissionMethods' => apply_filters( 'vfs_swift_api_write_http_methods', array( 'PUT', 'DELETE' ) ),
			)
		);

		return array(
			'user'  => array(),
			'error' => is_wp_error( $this->result ) ? $this->result->get_error_message() : null,
			'token' => is_wp_error( $this->result ) || is_null( $this->result ) ? null : $this->result['token'],
		);
	}

	/**
	 * Render the token creation form
	 */
	public function render() {
		?>
		<form
			method="post"
			data-wp-on--submit="callbacks.createToken"
			id="vfs-token-creation-container"
			class="card"
			data-wp-interactive="<?php echo esc_attr( self::INTERACTIVITY_STORE_NAMESPACE ); ?>"
			<?php echo wp_interactivity_data_wp_context( $this->interactivity_context() ); ?>
		>
			<hgroup class="vfs-token-creation-header">
				<h2 class="title"><?php esc_html_e( 'Token creation', 'vfs' ); ?></h2>
				<label for="vfs-token-creation-vcard" class="vfs-token-creation-vcard-label">
					<?php esc_html_e( 'VCard file', 'vfs' ); ?>
					<input
						type="file"
						name="vfs-token-creation-vcard"
						id="vfs-token-creation-vcard"
						accept="text/contacts+json;items=name,tel"
						data-wp-bind--accept="state.contactsAccept"
						data-wp-on--change="callbacks.readVCard"
						data-wp-on--click="callbacks.pickContacts"
					/>
				</label>
			</hgroup>
			<?php $this->render_result(); ?>
			<input type="hidden" name="action" value="<?php echo esc_attr( self::ACTION_NAME ); ?>" />
			<?php wp_nonce_field( self::ACTION_NAME ); ?>
			<div class="vfs-token-creation-form-rows">
				<div class="vfs-token-creation-form-row">
					<label for="vfs-token-creation-email"><?php esc_html_e( 'Email', 'vfs' ); ?></label>
					<input
						type="email"
						class="regular-text"
						name="vfs-token-creation-email"
						id="vfs-token-creation-email"
						<?php
						if ( isset( $_REQUEST['vfs-token-creation-email'] ) ) :
							echo 'value="' . esc_attr( $_REQUEST['vfs-token-creation-email'] ) . '"';
						endif;
						?>
						data-wp-on--input="callbacks.setContextAttribute"
						data-user-attribute="email"
					/>
				</div>
				<fieldset class="vfs-token-creation-form-row">
					<legend><?php esc_html_e( 'Expiration', 'vfs' ); ?></legend>
					<div class="vfs-token-creation-form-row-expiration">
						<label for="vfs-token-creation-never-expires"><?php esc_html_e( 'Never expires', 'vfs' ); ?></label>
						<input
							type="checkbox"
							name="vfs-token-creation-never-expires"
							id="vfs-token-creation-never-expires"
							<?php checked( isset( $_REQUEST['vfs-token-creation-never-expires'] ) ); ?>
						/>
						<label for="vfs-token-creation-expires-at"><?php esc_html_e( 'Expires at', 'vfs' ); ?>
							<input
								type="date"
								min="<?php echo esc_attr( gmdate( 'Y-m-d', time() + 3600 * 24 ) ); ?>"
								value="<?php echo esc_attr( $_REQUEST['vfs-token-creation-expires-at'] ?? gmdate( 'Y-m-d', time() + 3600 * 24 * 365 ) ); ?>"
								name="vfs-token-creation-expires-at"
								id="vfs-token-creation-expires-at"
							/>
						</label>
					</div>
				</fieldset>
				<div class="vfs-token-creation-form-row">
					<label for="vfs-token-creation-scope"><?php esc_html_e( 'Scope', 'vfs' ); ?></label>
					<input
						type="text"
						class="regular-text"
						name="vfs-token-creation-scope"
						id="vfs-token-creation-scope"
						value="<?php echo esc_attr( $_REQUEST['vfs-token-creation-scope'] ?? '' ); ?>"
					/>
				</div>
				<fieldset class="vfs-token-creation-form-row">
					<legend><?php esc_html_e( 'Permissions', 'vfs' ); ?></legend>
					<label for="vfs-token-creation-permissions-read">
						<input
							type="checkbox"
							name="vfs-token-creation-permissions-read"
							id="vfs-token-creation-permissions-read"
							<?php checked( isset( $_REQUEST['vfs-token-creation-permissions-read'] ) || empty( $_REQUEST['action'] ) || self::ACTION_NAME !== $_REQUEST['action'] ); ?>
						/>
						<?php esc_html_e( 'Read', 'vfs' ); ?>
					</label>
					<label for="vfs-token-creation-permissions-write">
						<input
							type="checkbox"
							name="vfs-token-creation-permissions-write"
							id="vfs-token-creation-permissions-write"
							<?php checked( isset( $_REQUEST['vfs-token-creation-permissions-write'] ) || empty( $_REQUEST['action'] ) || self::ACTION_NAME !== $_REQUEST['action'] ); ?>
						/>
						<?php esc_html_e( 'Write', 'vfs' ); ?>
					</label>
				</fieldset>
				<div class="vfs-token-creation-form-row">
					<label for="vfs-token-creation-display-name"><?php esc_html_e( 'Display name', 'vfs' ); ?></label>
					<input
						type="text"
						class="regular-text"
						name="vfs-token-creation-display-name"
						id="vfs-token-creation-display-name"
						value="<?php echo esc_attr( $_REQUEST['vfs-token-creation-display-name'] ?? '' ); ?>"
						data-wp-on--input="callbacks.setContextAttribute"
						data-user-attribute="displayName"
					/>
				</div>
				<div class="vfs-token-creation-form-row">
					<label for="vfs-token-creation-user-id"><?php esc_html_e( 'User ID', 'vfs' ); ?></label>
					<input
						type="text"
						class="regular-text"
						name="vfs-token-creation-user-id"
						id="vfs-token-creation-user-id"
						<?php
						if ( ! empty( $_REQUEST['vfs-token-creation-user-id'] ) ) :
							echo 'value="' . esc_attr( $_REQUEST['vfs-token-creation-user-id'] ) . '"';
						endif;
						?>
						<?php
						$user_id     = $this->get_user_id( $_REQUEST );
						$placeholder = $user_id ? $user_id : __( 'Automatically computed', 'vfs' );
						echo 'placeholder="' . esc_attr( $placeholder ) . '"';
						?>
						data-wp-bind--placeholder="state.userId"
					/>
				</div>
				<div class="vfs-token-creation-form-row">
					<?php submit_button( __( 'Create', 'vfs' ), 'primary', 'submit', false ); ?>
				</div>
			</div>
		</form>
		<?php
	}

	/**
	 * Get user ID
	 *
	 * @since 1.0.0
	 * @param array $request Request.
	 * @return string|false User ID.
	 */
	public function get_user_id( $request ) {
		if ( ! empty( $request['vfs-token-creation-user-id'] ) ) {
			return $request['vfs-token-creation-user-id'];
		}

		if ( ! empty( $request['vfs-token-creation-email'] ) ) {
			return $request['vfs-token-creation-email'];
		}

		if ( ! empty( $request['vfs-token-creation-display-name'] ) ) {
			return str_replace( ' ', '.', strtolower( $request['vfs-token-creation-display-name'] ) );
		}

		return false;
	}

	/**
	 * Render the token creation result
	 *
	 * @param bool $inline Whether to render the result inline.
	 */
	public function render_result( $inline = true ) {
		wp_admin_notice(
			'<p data-wp-text="context.error">' . ( is_wp_error( $this->result ) ? esc_html( $this->result->get_error_message() ) : '' ) . '</p>',
			array(
				'type'               => 'error',
				'paragraph_wrap'     => false,
				'additional_classes' => $inline ? array( 'inline' ) : array(),
				'attributes'         => array(
					'data-wp-bind--hidden' => '!context.error',
					'hidden'               => is_wp_error( $this->result ) ? null : 'hidden',
				),
			)
		);

		wp_admin_notice(
			// translators: %s is the user ID.
			'<p>' . sprintf( __( 'The token for <i>%s</i> has been created successfully.', 'vfs' ), esc_html( $this->get_user_id( $_REQUEST ) ) ) . '</p>'
			. '<div class="token-result-container">'
			. '<button class="button button-primary copy-button">' . esc_html__( 'Copy', 'vfs' ) . '</button>'
			. '<pre class="generated-token" data-wp-text="context.token">' . esc_html( is_wp_error( $this->result ) || is_null( $this->result ) ? '' : $this->result['token'] ) . '</pre>'
			. '</div>',
			array(
				'type'               => 'success',
				'paragraph_wrap'     => false,
				'additional_classes' => $inline ? array( 'vfs-token-creation-success', 'inline' ) : array( 'vfs-token-creation-success' ),
				'attributes'         => array(
					'data-wp-bind--hidden' => '!context.token',
					'hidden'               => is_wp_error( $this->result ) || is_null( $this->result ) ? 'hidden' : null,
				),
			)
		);
	}
}
