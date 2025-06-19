<?php
/**
 * Admin page class
 *
 * @package CustomerData
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace CustomerData;

/**
 * Class Settings_Page
 *
 * @since 1.0.0
 */
class Settings_Page {

	/**
	 * Admin settings script and style handle
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SCRIPT_HANDLE = 'customer-data-admin-settings';

	/**
	 * Interactivity store namespace
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const INTERACTIVITY_STORE_NAMESPACE = 'customer-data-admin-settings';

	/**
	 * Menu slug
	 *
	 * @var string
	 */
	const MENU_SLUG = 'visitor-filesystem';

	/**
	 * Options page ID
	 *
	 * @var string
	 */
	const OPTIONS_PAGE_ID = 'customer-data-options';

	/**
	 * Generate URL page ID
	 *
	 * @var string
	 */
	const GENERATE_URL_PAGE_ID = 'customer-data-generate-url';

	/**
	 * General section
	 *
	 * @var string
	 */
	const GENERAL_SECTION = 'general';

	/**
	 * Generate URL section
	 *
	 * @var string
	 */
	const GENERATE_URL_SECTION = 'generate_url';

	/**
	 * Swift provider section
	 *
	 * @var string
	 */
	const SWIFT_PROVIDER_SECTION = 'swift_provider';

	/**
	 * URL signature section
	 *
	 * @var string
	 */
	const URL_SIGNATURE_SECTION = 'url_signature';

	/**
	 * Key management section
	 *
	 * @var string
	 */
	const KEY_MANAGEMENT_SECTION = 'key_management';

	/**
	 * Load hook suffix
	 *
	 * @var string
	 */
	private $load_hook_suffix;

	/**
	 * Register hooks
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_hooks() {
		$instance = new self();

		add_action( 'admin_menu', array( $instance, 'add_admin_menu' ) );
		add_action( 'admin_init', array( $instance, 'settings_init' ) );
		add_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_admin_script' ) );
		add_action( 'admin_action_' . Keyset::CREATE_ACTION, array( $instance, 'load' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( CUSTOMER_DATA_PLUGIN_FILE ), array( $instance, 'plugin_settings' ), 10, 4 );
		add_filter( 'customer_data_keyset_action_url', array( $instance, 'filter_action_url' ), 10, 2 );
	}

	/**
	 * Add settings link to the plugin page
	 *
	 * @since 1.0.0
	 * @param array $links Plugin links.
	 * @return array Modified plugin links.
	 */
	public function plugin_settings( $links ) {
		array_unshift( $links, '<a href="' . esc_url( $this->get_url() ) . '&amp;sub=options">' . esc_html__( 'Settings', 'customer-data' ) . '</a>' );
		return $links;
	}

	/**
	 * Get admin URL
	 *
	 * @since 1.0.0
	 * @param array|string $params URL parameters.
	 * @return string Admin URL.
	 */
	public function get_url( $params = array() ) {
		if ( is_string( $params ) ) {
			$params = wp_parse_args( $params, array() );
		}

		$params['page'] = self::MENU_SLUG;
		return admin_url( 'options-general.php?' . http_build_query( $params ) );
	}

	/**
	 * Get admin URL
	 *
	 * @since 1.0.0
	 * @param array|string $params URL parameters.
	 * @param bool         $nonce  Whether to add a nonce.
	 * @return string Admin URL.
	 */
	public function action_url( $params = array(), $nonce = true ) {
		if ( is_string( $params ) ) {
			$params = wp_parse_args( $params, array() );
		}

		if ( $nonce ) {
			if ( is_string( $nonce ) ) {
				$params['_wpnonce'] = $nonce;
			} else {
				$params['_wpnonce'] = wp_create_nonce( 'customer-data-action' );
			}
		}

		if ( isset( $params['page'] ) ) {
			unset( $params['page'] );
		}

		$params['option_page'] = self::OPTIONS_PAGE_ID;

		return admin_url( 'options.php?' . http_build_query( $params ) );
	}

	/**
	 * Enqueue admin scripts
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page.
	 * @return void
	 */
	public function enqueue_admin_script( $hook ) {
		$err = Scripts::register_with_assets( self::SCRIPT_HANDLE, 'admin-settings/settings-page.asset.php', true, array( 'wp-components' ) );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}

		$err = Scripts::register_with_assets( self::SCRIPT_HANDLE, 'admin-settings/settings-page-interactivity.asset.php' );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}

		if ( $this->load_hook_suffix !== $hook ) {
			return;
		}

		$err = Scripts::enqueue_script( self::SCRIPT_HANDLE, 'admin-settings/settings-page.asset.php' );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}

		Scripts::enqueue_style( self::SCRIPT_HANDLE );

		$err = Scripts::enqueue_script( self::SCRIPT_HANDLE, 'admin-settings/settings-page-interactivity.asset.php' );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}

		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			'window.customerDataAdminConfig = ' . wp_json_encode( Scripts::admin_config() )
		);
	}

	/**
	 * Add admin menu
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function add_admin_menu() {
		$this->load_hook_suffix = add_options_page(
			__( 'Visitor Filesystem', 'customer-data' ),
			__( 'Visitor Filesystem', 'customer-data' ),
			'manage_options',
			self::MENU_SLUG,
			array( $this, 'options_page' )
		);
	}

	/**
	 * Options page
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function options_page() {
		$options = Options::load();

		wp_interactivity_state(
			self::INTERACTIVITY_STORE_NAMESPACE,
			array(
				'state' => array(
					'features' => array(
						'staticSignature' => $options->swift_signature_static,
						'keyManagement'   => $options->key_management->enabled,
					),
				),
			)
		);
		?>
		<h1><?php esc_html_e( 'Visitor Filesystem settings', 'customer-data' ); ?></h1>

		<div class="wrap" id="customer-data-content"
			data-wp-interactive="<?php echo esc_attr( self::INTERACTIVITY_STORE_NAMESPACE ); ?>"
			data-wp-init="callbacks.bindFeatures"
			>
			<form action="<?php echo esc_url( admin_url( 'options.php' ) ); ?>" method="post" data-wp-on-async--reset="callbacks.resetFeature">
				<?php
				settings_fields( Options::OPTION_NAME );
				do_settings_sections( self::OPTIONS_PAGE_ID );
				?>
				<p>
					<input type="reset" class="button" value="<?php esc_attr_e( 'Reset', 'customer-data' ); ?>" />

					<?php submit_button( null, 'primary', 'submit', false ); ?>
				</p>
			</form>
		</div>
		<?php
	}

	/**
	 * Filter action URL
	 *
	 * @param string $url Action URL.
	 * @param string $action Action name.
	 * @return string Filtered action URL.
	 */
	public function filter_action_url( $url, $action ) {
		return add_query_arg(
			array(
				'_wp_http_referer' => rawurlencode( $this->get_url( array( 'action' => $action ) ) ),
				'page'             => self::MENU_SLUG,
			),
			$url
		);
	}

	/**
	 * Initialize settings
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function settings_init() {
		add_settings_section(
			self::GENERAL_SECTION,
			__( 'General', 'customer-data' ),
			array( $this, 'general_section_callback' ),
			self::OPTIONS_PAGE_ID
		);

		add_settings_field(
			'allow_scoped_tokens',
			__( 'Allow scoped tokens', 'customer-data' ),
			array( $this, 'allow_scoped_tokens_render' ),
			self::OPTIONS_PAGE_ID,
			self::GENERAL_SECTION,
			array(
				'class'     => 'customer-data-allow-scoped-tokens-container',
				'label_for' => 'customer-data-allow-scoped-tokens',
			)
		);

		add_settings_section(
			self::SWIFT_PROVIDER_SECTION,
			__( 'Swift provider', 'customer-data' ),
			array( $this, 'swift_provider_section_callback' ),
			self::OPTIONS_PAGE_ID,
		);

		add_settings_field(
			'swift_auth_url',
			__( 'Swift auth URL', 'customer-data' ),
			array( $this, 'swift_auth_url_render' ),
			self::OPTIONS_PAGE_ID,
			self::SWIFT_PROVIDER_SECTION,
			array(
				'class'     => 'customer-data-swift-auth-url-container',
				'label_for' => 'customer-data-swift-auth-url',
			)
		);

		add_settings_field(
			'swift_identity_api_version',
			__( 'Swift identity API version', 'customer-data' ),
			array( $this, 'swift_identity_api_version_render' ),
			self::OPTIONS_PAGE_ID,
			self::SWIFT_PROVIDER_SECTION,
			array(
				'class'     => 'customer-data-swift-identity-api-version-container',
				'label_for' => 'customer-data-swift-identity-api-version',
			)
		);

		add_settings_field(
			'swift_user_domain_name',
			__( 'Swift user domain name', 'customer-data' ),
			array( $this, 'swift_user_domain_name_render' ),
			self::OPTIONS_PAGE_ID,
			self::SWIFT_PROVIDER_SECTION,
			array(
				'class'     => 'customer-data-swift-user-domain-name-container',
				'label_for' => 'customer-data-swift-user-domain-name',
			)
		);

		add_settings_field(
			'swift_region',
			__( 'Swift region', 'customer-data' ) . wp_required_field_indicator(),
			array( $this, 'swift_region_render' ),
			self::OPTIONS_PAGE_ID,
			self::SWIFT_PROVIDER_SECTION,
			array(
				'class'     => 'customer-data-swift-region-container',
				'label_for' => 'customer-data-swift-region',
			)
		);

		add_settings_field(
			'swift_tenant_id',
			__( 'Swift tenant ID', 'customer-data' ),
			array( $this, 'swift_tenant_id_render' ),
			self::OPTIONS_PAGE_ID,
			self::SWIFT_PROVIDER_SECTION,
			array(
				'class'     => 'customer-data-swift-tenant-id-container',
				'label_for' => 'customer-data-swift-tenant-id',
			)
		);

		add_settings_field(
			'swift_tenant_name',
			__( 'Swift tenant name', 'customer-data' ),
			array( $this, 'swift_tenant_name_render' ),
			self::OPTIONS_PAGE_ID,
			self::SWIFT_PROVIDER_SECTION,
			array(
				'class'     => 'customer-data-swift-tenant-name-container',
				'label_for' => 'customer-data-swift-tenant-name',
			)
		);

		add_settings_field(
			'swift_user',
			__( 'Swift user', 'customer-data' ),
			array( $this, 'swift_user_render' ),
			self::OPTIONS_PAGE_ID,
			self::SWIFT_PROVIDER_SECTION,
			array(
				'class'     => 'customer-data-swift-user-container',
				'label_for' => 'customer-data-swift-user',
			)
		);

		add_settings_field(
			'swift_password',
			__( 'Swift password', 'customer-data' ),
			array( $this, 'swift_password_render' ),
			self::OPTIONS_PAGE_ID,
			self::SWIFT_PROVIDER_SECTION,
			array(
				'class'     => 'customer-data-swift-password-container',
				'label_for' => 'customer-data-swift-password',
			)
		);

		add_settings_field(
			'swift_container',
			__( 'Swift container', 'customer-data' ) . wp_required_field_indicator(),
			array( $this, 'swift_container_render' ),
			self::OPTIONS_PAGE_ID,
			self::SWIFT_PROVIDER_SECTION,
			array(
				'class'     => 'customer-data-swift-container-container',
				'label_for' => 'customer-data-swift-container',
			)
		);

		add_settings_field(
			'swift_additional_prefix',
			__( 'Swift additional prefix', 'customer-data' ),
			array( $this, 'swift_additional_prefix_render' ),
			self::OPTIONS_PAGE_ID,
			self::SWIFT_PROVIDER_SECTION,
			array(
				'class'     => 'customer-data-swift-additional-prefix-container',
				'label_for' => 'customer-data-swift-additional-prefix',
			)
		);

		add_settings_section(
			self::URL_SIGNATURE_SECTION,
			__( 'Advanced', 'customer-data' ),
			array( $this, 'advanced_section_callback' ),
			self::OPTIONS_PAGE_ID,
		);

		add_settings_field(
			'swift_account_url',
			__( 'Swift base URL', 'customer-data' ),
			array( $this, 'swift_account_url_render' ),
			self::OPTIONS_PAGE_ID,
			self::URL_SIGNATURE_SECTION,
			array(
				'class'     => 'customer-data-swift-base-url-container',
				'label_for' => 'customer-data-swift-base-url',
			)
		);

		add_settings_field(
			'signature_static_key',
			__( 'Static value?', 'customer-data' ),
			array( $this, 'swift_signature_static_key_render' ),
			self::OPTIONS_PAGE_ID,
			self::URL_SIGNATURE_SECTION,
			array(
				'class'     => 'customer-data-signature-static-key-container',
				'label_for' => 'customer-data-signature-static-key',
			)
		);

		add_settings_field(
			'signature_key_value',
			__( 'Value', 'customer-data' ),
			array( $this, 'swift_signature_key_value_render' ),
			self::OPTIONS_PAGE_ID,
			self::URL_SIGNATURE_SECTION,
			array(
				'class'     => 'customer-data-signature-key-value-container customer-data-admin-settings-static-signature-enabled',
				'label_for' => 'customer-data-signature-key-value',
			)
		);

		$keys = Options::load()->get_signature_keys_from_swift();

		add_settings_field(
			'signature_key',
			_n( 'Signature key', 'Signature keys', is_wp_error( $keys ) ? 0 : $keys->count(), 'customer-data' ),
			array( $this, 'swift_signature_key_render' ),
			self::OPTIONS_PAGE_ID,
			self::URL_SIGNATURE_SECTION,
			array(
				'class' => 'customer-data-signature-key-container customer-data-admin-settings-static-signature-disabled',
				// No label for: there is not *main* input for this setting.
			)
		);

		add_settings_field(
			'swift_signature_hmac_algo',
			__( 'Swift signature algo', 'customer-data' ) . wp_required_field_indicator(),
			array( $this, 'swift_signature_hmac_algo_render' ),
			self::OPTIONS_PAGE_ID,
			self::URL_SIGNATURE_SECTION,
			array(
				'class'     => 'customer-data-swift-signature-algo-container',
				'label_for' => 'customer-data-swift-signature-algo',
			)
		);

		add_settings_section(
			self::KEY_MANAGEMENT_SECTION,
			__( 'Key management', 'customer-data' ),
			array( $this, 'key_management_section_callback' ),
			self::OPTIONS_PAGE_ID,
		);

		add_settings_field(
			'key_management_enabled',
			__( 'Enable key management', 'customer-data' ),
			array( $this, 'key_management_enabled_render' ),
			self::OPTIONS_PAGE_ID,
			self::KEY_MANAGEMENT_SECTION,
			array(
				'class'     => 'customer-data-key-management-enabled-container',
				'label_for' => 'customer-data-key-management-enabled',
			)
		);

		add_settings_field(
			'key_management_keyset',
			__( 'Keys set', 'customer-data' ),
			array( $this, 'key_management_keyset_render' ),
			self::OPTIONS_PAGE_ID,
			self::KEY_MANAGEMENT_SECTION,
			array(
				'class' => 'customer-data-key-management-keyset-container customer-data-admin-settings-key-management-enabled',
				// No label for: there is not *main* input for this setting.
			)
		);

		add_settings_field(
			'key_management_jwks_url',
			__( 'JWKS URL', 'customer-data' ),
			array( $this, 'key_management_jwks_url_render' ),
			self::OPTIONS_PAGE_ID,
			self::KEY_MANAGEMENT_SECTION,
			array(
				'class'     => 'customer-data-key-management-jwks-url-container customer-data-admin-settings-key-management-disabled',
				'label_for' => 'customer-data-key-management-jwks-url',
			)
		);
	}

	/**
	 * Generate URL section callback
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function general_section_callback() {
		?>
		<p><?php esc_html_e( 'This section allows you to manage the general settings.', 'customer-data' ); ?></p>
		<?php
	}

	/**
	 * Allow scoped tokens render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function allow_scoped_tokens_render() {
		?>
		<input type="checkbox" id="customer-data-allow-scoped-tokens" name="<?php echo esc_attr( Options::OPTION_NAME . '[allow_scoped_tokens]' ); ?>" value="1" <?php checked( Options::load()->allow_scoped_tokens, 1 ); ?>>
		<?php
	}

	/**
	 * Swift provider section callback
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_provider_section_callback() {
		?>
		<div id="customer-data-swift-provider-openrc-loader">
			<input type="file" id="customer-data-swift-provider-openrc-file" name="customer-data-swift-provider-openrc-file" data-wp-on--input="callbacks.loadOpenrc">
		</div>
		<p id="customer-data-swift-provider-section-description">
			<?php esc_html_e( 'These settings are used to interact with the Swift provider.', 'customer-data' ); ?>
		</p>
		<?php
	}

	/**
	 * Swift auth URL render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_auth_url_render() {
		?>
		<input type="url" id="customer-data-swift-auth-url" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_auth_url]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_auth_url ); ?>">
		<?php
	}

	/**
	 * Swift identity API version render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_identity_api_version_render() {
		?>
		<select id="customer-data-swift-identity-api-version" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_identity_api_version]' ); ?>">
			<option <?php selected( Options::load()->swift_identity_api_version, '3' ); ?> value="3"><?php echo esc_html_x( 'v3', 'The openstack identity API version', 'customer-data' ); ?></option>
			<option <?php selected( Options::load()->swift_identity_api_version, '2' ); ?> value="2"><?php echo esc_html_x( 'v2', 'The openstack identity API version', 'customer-data' ); ?></option>
		</select>
		<?php
	}

	/**
	 * Swift user domain name render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_user_domain_name_render() {
		?>
		<input type="text" id="customer-data-swift-user-domain-name" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_user_domain_name]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_user_domain_name ); ?>">
		<?php
	}

	/**
	 * Swift region name render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_region_render() {
		?>
		<input required type="text" id="customer-data-swift-region" list="customer-data-swift-region-list" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_region]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_region ); ?>">
		<datalist id="customer-data-swift-region-list">
			<?php
			$regions = Options::load()->get_available_regions();
			if ( ! is_wp_error( $regions ) ) :
				sort( $regions );
				foreach ( $regions as $region ) :
					?>
					<option value="<?php echo esc_attr( $region ); ?>"></option>
					<?php
				endforeach;
			endif;
			?>
		</datalist>
		<?php
	}

	/**
	 * Swift tenant ID render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_tenant_id_render() {
		?>
		<input type="text" id="customer-data-swift-tenant-id" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_tenant_id]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_tenant_id ); ?>">
		<?php
	}

	/**
	 * Swift tenant name render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_tenant_name_render() {
		?>
		<input type="text" id="customer-data-swift-tenant-name" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_tenant_name]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_tenant_name ); ?>">
		<?php
	}

	/**
	 * Swift user render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_user_render() {
		?>
		<input type="text" id="customer-data-swift-user" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_user]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_user ); ?>">
		<?php
	}

	/**
	 * Swift password render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_password_render() {
		?>
		<input type="password" id="customer-data-swift-password" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_password]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_password ); ?>">
		<?php
	}

	/**
	 * Advanced section callback
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function advanced_section_callback() {
		?>
		<p><?php esc_html_e( 'These settings are used to interact with the Swift provider.', 'customer-data' ); ?></p>
		<?php
	}

	/**
	 * Swift signature static key render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_signature_static_key_render() {
		?>
		<input type="checkbox" id="customer-data-signature-static-key" data-wp-on-async--change="callbacks.propagateFeatureChange" data-customer-data-admin-settings-feature-target="staticSignature" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_signature_static]' ); ?>" value="1" <?php checked( Options::load()->swift_signature_static ); ?>>
		<?php
	}

	/**
	 * Swift signature key value render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_signature_key_value_render() {
		?>
		<input type="password" id="customer-data-signature-key-value" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_signature_value]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_signature_value ); ?>">
		<?php
	}

	/**
	 * Swift signature key render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_signature_key_render() {
		$keys = Options::load()->get_signature_keys_from_swift();

		$keys->prepare_items();
		?>
		<div id="customer-data-temp-keys-list">
			<?php $keys->display(); ?>
		</div>
		<?php
	}

	/**
	 * Swift account URL render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_account_url_render() {
		$value_from_catalog = Options::load()->get_swift_account_url_from_catalog();
		?>
		<input type="text" id="customer-data-swift-base-url" placeholder="<?php echo is_wp_error( $value_from_catalog ) ? '' : esc_attr( $value_from_catalog ); ?>" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_account_url]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_account_url ); ?>">
		<?php
	}

	/**
	 * Swift container render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_container_render() {
		?>
		<input required type="text" id="customer-data-swift-container" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_container]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_container ); ?>">
		<?php
	}

	/**
	 * Swift additional prefix render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_additional_prefix_render() {
		?>
		<input type="text" id="customer-data-swift-additional-prefix" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_additional_prefix]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_additional_prefix ); ?>">
		<?php
	}

	/**
	 * Swift signature HMAC algo render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function swift_signature_hmac_algo_render() {
		?>
		<input type="text" id="customer-data-swift-signature-algo" name="<?php echo esc_attr( Options::OPTION_NAME . '[swift_signature_hmac_algo]' ); ?>" value="<?php echo esc_attr( Options::load()->swift_signature_hmac_algo ); ?>" list="customer-data-swift-signature-algo-list">
		<?php
		$algos = Options::load()->get_available_algorithms();
		if ( is_wp_error( $algos ) ) {
			$algos = array( 'SHA-256', 'SHA-512' );
		}
		?>
		<datalist id="customer-data-swift-signature-algo-list">
			<?php
			$algos = apply_filters( 'customer_data_valids_hmac_algos', $algos );
			foreach ( $algos as $algo ) :
				?>
				<option value="<?php echo esc_attr( $algo ); ?>">
					<?php echo esc_html( $algo ); ?>
				</option>
				<?php
			endforeach;
			?>
		</datalist>
		<?php
	}

	/**
	 * Key management section callback
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function key_management_section_callback() {
		?>
		<p><?php esc_html_e( 'This section allows you to manage the key management.', 'customer-data' ); ?></p>
		<?php
	}

	/**
	 * Key management enabled render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function key_management_enabled_render() {
		?>
		<input type="checkbox" id="customer-data-key-management-enabled" data-wp-on-async--change="callbacks.propagateFeatureChange" data-customer-data-admin-settings-feature-target="keyManagement" name="<?php echo esc_attr( Options::OPTION_NAME . '[key_management][enabled]' ); ?>" value="1" <?php checked( Options::load()->key_management->enabled, 1 ); ?>>
		<?php
	}

	/**
	 * Key management keyset render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function key_management_keyset_render() {
		$keyset = new Keyset();

		$keyset->prepare_items();
		?>
		<div id="customer-data-key-management-list">
			<?php $keyset->display(); ?>
		</div>
		<?php
	}

	/**
	 * Key management JWKS URL render
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function key_management_jwks_url_render() {
		?>
		<input type="url" id="customer-data-key-management-jwks-url" placeholder="<?php echo esc_attr( get_rest_url( null, '/customer-data/v1/jwks' ) ); ?>" class="large-text" name="<?php echo esc_attr( Options::OPTION_NAME . '[key_management][jwks_url]' ); ?>" value="<?php echo esc_attr( Options::load()->key_management->jwks_url ); ?>">
		<?php
	}
}
