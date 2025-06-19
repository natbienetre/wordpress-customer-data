<?php
/**
 * Editor class
 *
 * @package CustomerData
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace CustomerData;

use WP_Block_Type_Registry;

/**
 * Class Editor
 *
 * @since 1.0.0
 */
class Editor {
	/**
	 * Sidebar script and style handle
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SCRIPT_HANDLE = 'customer-data-editor';

	/**
	 * Upload block frontend script handle
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const UPLOAD_BLOCK_FRONTEND_SCRIPT_HANDLE = 'customer-data-blocks-lib';

	/**
	 * Admin block admin script handle
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const UPLOAD_BLOCK_ADMIN_SCRIPT_HANDLE = 'customer-data-file-upload-editor-script';

	/**
	 * Frontend script handle
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const FRONTEND_SCRIPT_HANDLE = 'customer-data-frontend-scripts';

	/**
	 * Token visibility script handle
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const TOKEN_VISIBILITY_SCRIPT_HANDLE = 'customer-data-token-visibility-interactivity';

	/**
	 * Register hooks
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_hooks(): void {
		$instance = new self();

		add_action( 'init', array( $instance, 'register_post_meta' ) );
		add_action( 'init', array( $instance, 'register_blocks_collection' ) );
		add_action( 'wp_enqueue_scripts', array( $instance, 'frontend_enqueue_scripts' ) );
		add_action( 'enqueue_block_editor_assets', array( $instance, 'enqueue_editor_assets' ) );
		add_filter( 'customer_data_interactivity_config', array( $instance, 'interactivity_config' ) );
		add_filter( 'block_editor_settings_all', array( $instance, 'default_block_visibility_helper_settings' ) );
	}

	/**
	 * Enqueue editor assets
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function enqueue_editor_assets(): void {
		$err = Scripts::register_with_assets(
			self::SCRIPT_HANDLE,
			'admin-settings/editor.asset.php',
			true,
			array(
				'wp-components',
				'dashicons',
			)
		);
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
			return;
		}

		Scripts::enqueue_script( self::SCRIPT_HANDLE, 'admin-settings/editor.asset.php' );
		Scripts::enqueue_style( self::SCRIPT_HANDLE );

		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			'window.customerDataAdminConfig = ' . wp_json_encode( Scripts::admin_config() )
		);
	}

	/**
	 * Interactivity config
	 *
	 * @since 1.0.0
	 * @param array $config The config.
	 * @return array Modified config.
	 */
	public function interactivity_config( $config ) {
		$options = Options::load();

		$config['prefix']       = $options->swift_additional_prefix;
		$config['container']    = $options->swift_container;
		$config['swiftBaseUrl'] = $options->get_swift_account_url();
		if ( $options->inject_keyset ) {
			$config['keySet'] = ( new Keyset() )->get_public_keyset();
		}

		return $config;
	}

	/**
	 * Register blocks
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_blocks_collection(): void {
		$this->register_block_types_from_metadata_collection(
			path_join( plugin_dir_path( CUSTOMER_DATA_PLUGIN_FILE ), path_join( Scripts::BUILD_DIR, 'blocks' ) ),
			path_join( plugin_dir_path( CUSTOMER_DATA_PLUGIN_FILE ), path_join( Scripts::BUILD_DIR, 'blocks-manifest.php' ) )
		);
	}

	/**
	 * Register block types from metadata collection
	 *
	 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
	 *
	 * @since 1.0.0
	 * @param string $path The path to the blocks.
	 * @param string $manifest_path The path to the manifest file.
	 * @return void
	 */
	private function register_block_types_from_metadata_collection( $path, $manifest_path ): void {
		if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
			wp_register_block_types_from_metadata_collection( $path, $manifest_path );
			return;
		}

		if ( function_exists( 'wp_register_block_metadata_collection' ) ) {
			wp_register_block_metadata_collection( $path, $manifest_path );
		}

		$manifest_data = require $manifest_path;
		foreach ( $manifest_data as $block_type => $block ) {
			$registered_block = register_block_type( path_join( $path, $block_type ) );
			if ( $registered_block ) {
				wp_set_script_translations(
					array_pop( $registered_block->view_script_handles ),
					$block['textdomain'],
					path_join( plugin_dir_path( CUSTOMER_DATA_PLUGIN_FILE ), 'languages/' )
				);
			}
		}
	}

	/**
	 * Register inline scripts
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function frontend_enqueue_scripts(): void {
		$options = Options::load();

		Scripts::register_with_assets( self::TOKEN_VISIBILITY_SCRIPT_HANDLE, 'admin-settings/token-visibility/frontend-interactivity.asset.php', true, array() );
		Scripts::enqueue_script( self::TOKEN_VISIBILITY_SCRIPT_HANDLE, 'admin-settings/token-visibility/frontend-interactivity.asset.php' );

		Scripts::register_with_assets( self::FRONTEND_SCRIPT_HANDLE, 'frontend.asset.php', true, array() );
		Scripts::enqueue_script( self::FRONTEND_SCRIPT_HANDLE, 'frontend.asset.php' );
		Scripts::enqueue_style( self::FRONTEND_SCRIPT_HANDLE );

		Scripts::register_with_assets( self::UPLOAD_BLOCK_FRONTEND_SCRIPT_HANDLE, 'blocks/lib.asset.php' );

		/* Blocks translations */
		$manifest_data = require path_join( plugin_dir_path( CUSTOMER_DATA_PLUGIN_FILE ), path_join( Scripts::BUILD_DIR, 'blocks-manifest.php' ) );
		foreach ( $manifest_data as $block ) {
			if ( ! isset( $block['textdomain'] ) ) {
				continue;
			}

			$registered_block = WP_Block_Type_Registry::get_instance()->get_registered( $block['name'] );
			if ( ! $registered_block ) {
				continue;
			}

			$handles = array_filter(
				$registered_block->view_script_handles,
				function ( $handle ) {
					return str_starts_with( $handle, 'file:' ) && str_ends_with( $handle, '.js' );
				}
			);

			foreach ( $handles as $handle ) {
				wp_set_script_translations(
					$handle,
					$block['textdomain'],
					path_join( plugin_dir_path( CUSTOMER_DATA_PLUGIN_FILE ), 'languages/' )
				);
			}
		}
	}

	/**
	 * Register post meta
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_post_meta(): void {
		register_post_meta(
			'',
			'_customer_data_subpath',
			array(
				'type'              => 'string',
				'label'             => __( 'Temporary URL subpath', 'customer-data' ),
				'single'            => true,
				'description'       => __( 'The path to append to the temporary URL. The generated URL will be the concatenation of the Swift account URL, the Swift container, the subpath, and the file destination.', 'customer-data' ),
				'show_in_rest'      => true,
				'auth_callback'     => '__return_true',
				'revisions_enabled' => false,
				'sanitize_callback' => array( $this, 'sanitize_customer_data_subpath' ),
			)
		);
	}

	/**
	 * Sanitize CustomerData subpath
	 *
	 * @since 1.0.0
	 * @param string $value The value to sanitize.
	 * @return string
	 */
	public function sanitize_customer_data_subpath( $value ): string {
		return wp_slash( sanitize_text_field( $value ) );
	}

	/**
	 * Default block visibility helper settings
	 *
	 * @since 1.0.0
	 * @param array $settings The settings.
	 * @return array Modified settings.
	 */
	public function default_block_visibility_helper_settings( $settings ) {
		$settings['customerDataBlockVisibilityHelper'] = false;
		return $settings;
	}
}
