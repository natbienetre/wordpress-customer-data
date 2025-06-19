<?php
/**
 * Scripts class
 *
 * @package CustomerData
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace CustomerData;

use WP_Error;

/**
 * Class Scripts
 *
 * @since 1.0.0
 */
class Scripts {
	/**
	 * Build directory
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const BUILD_DIR = 'build';

	/**
	 * Register script and style with assets
	 *
	 * @param string      $handle Script handle.
	 * @param string      $asset_path Asset path.
	 * @param bool        $in_footer Whether to enqueue in footer.
	 * @param array|false $style_dependencies Style dependencies.
	 * @return WP_Error|void
	 */
	public static function register_with_assets( $handle, $asset_path, $in_footer = true, $style_dependencies = false ) {
		$asset_local_path = path_join( plugin_dir_path( CUSTOMER_DATA_PLUGIN_FILE ), path_join( self::BUILD_DIR, $asset_path ) );
		if ( ! file_exists( $asset_local_path ) ) {
			return new WP_Error( 'asset_not_found', sprintf( 'Asset %s not found', $asset_path ) );
		}

		$asset = include $asset_local_path;
		if ( false === $asset ) {
			return new WP_Error( 'asset_not_found', sprintf( 'Asset %s not found', $asset_path ) );
		}

		if ( isset( $asset['type'] ) && 'module' === $asset['type'] ) {
			wp_register_script_module(
				$handle,
				plugins_url( self::BUILD_DIR . '/' . preg_replace( '/\.asset\.php$/i', '.js', $asset_path ), CUSTOMER_DATA_PLUGIN_FILE ),
				$asset['dependencies'],
				$asset['version']
			);

			// Translation not supported for module scripts.
			// @see https://core.trac.wordpress.org/ticket/60234 for more details.
		} else {
			wp_register_script(
				$handle,
				plugins_url( self::BUILD_DIR . '/' . preg_replace( '/\.asset\.php$/i', '.js', $asset_path ), CUSTOMER_DATA_PLUGIN_FILE ),
				$asset['dependencies'],
				$asset['version'],
				$in_footer
			);

			wp_set_script_translations(
				$handle,
				'customer-data',
				path_join( plugin_dir_path( CUSTOMER_DATA_PLUGIN_FILE ), 'languages/' )
			);
		}

		if ( false !== $style_dependencies ) {
			wp_register_style(
				$handle,
				plugins_url( self::BUILD_DIR . '/' . preg_replace( '/\.asset\.php$/i', '.css', $asset_path ), CUSTOMER_DATA_PLUGIN_FILE ),
				$style_dependencies,
				$asset['version']
			);
		}
	}

	/**
	 * Enqueue script
	 *
	 * @param string       $handle Script handle.
	 * @param string|false $asset_path Asset path.
	 * @return WP_Error|void
	 */
	public static function enqueue_script( $handle, $asset_path = false ) {
		if ( ! $asset_path ) {
			wp_enqueue_script( $handle );
			return;
		}

		$asset_local_path = path_join( plugin_dir_path( CUSTOMER_DATA_PLUGIN_FILE ), path_join( self::BUILD_DIR, $asset_path ) );
		if ( ! file_exists( $asset_local_path ) ) {
			return new WP_Error( 'asset_not_found', sprintf( 'Asset %s not found', $asset_path ) );
		}

		$asset = include $asset_local_path;
		if ( false === $asset ) {
			return new WP_Error( 'asset_not_found', sprintf( 'Asset %s not found', $asset_path ) );
		}

		if ( isset( $asset['type'] ) && 'module' === $asset['type'] ) {
			wp_enqueue_script_module( $handle );
			return;
		}

		wp_enqueue_script( $handle );
	}

	/**
	 * Enqueue style
	 *
	 * @param string $handle Style handle.
	 * @return void
	 */
	public static function enqueue_style( $handle ) {
		wp_enqueue_style( $handle );
	}

	/**
	 * Get admin configuration
	 *
	 * @return array Admin configuration.
	 */
	public static function admin_config() {
		$options = Options::load();
		$keyset  = new Keyset();

		$token = $options->openstack_token();
		if ( is_wp_error( $token ) ) {
			error_log_debug( $token->get_error_message() );
			$token = null;
		}

		return apply_filters(
			'customer_data_admin_config',
			array(
				'options'           => array(
					'token'              => $token,
					'authUrl'            => $options->swift_auth_url,
					'identityApiVersion' => $options->swift_identity_api_version,
					'userDomainName'     => $options->swift_user_domain_name,
					'tenantId'           => $options->swift_tenant_id,
					'tenantName'         => $options->swift_tenant_name,
					'user'               => $options->swift_user,
					'password'           => $options->swift_password,
					'container'          => $options->swift_container,
					'accountUrl'         => $options->get_swift_account_url(),
					'signatureLocation'  => $options->swift_signature_location,
					'additionalPrefix'   => $options->swift_additional_prefix,
					'signatureHmacAlgo'  => $options->swift_signature_hmac_algo,
					'swiftBaseUrl'       => $options->get_swift_account_url(),
					'account'            => '$options->swift_account',
					'prefix'             => $options->swift_additional_prefix,
				),
				'allowScopedTokens' => $options->allow_scoped_tokens,
				'keys'              => $keyset->keys,
				'keyManagement'     => array(
					'enabled' => $options->key_management->enabled,
					'mainKey' => $options->key_management->main_key,
					'jwksUrl' => $options->key_management->jwks_url,
				),
			)
		);
	}
}
