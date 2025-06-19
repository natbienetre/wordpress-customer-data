<?php
/**
 * Customer Data plugin main file.
 *
 * @package CustomerData
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name:       Customer Data
 * Plugin URI:        https://github.com/natbienetre/wordpress-customer-data
 * Version:           1.0.1
 * GitHub Plugin URI: natbienetre/wordpress-customer-data
 * Funding URI:       https://github.com/sponsors/holyhope
 * Description:       Helps visitor to upload files and manage them.
 * Author:            @holyhope
 * Author URI:        https://github.com/holyhope
 * Text Domain:       customer-data
 * Domain Path:       /languages
 */

/**
 * Autoload the classes
 */
require 'autoload.php';

define( 'CUSTOMER_DATA_PLUGIN_FILE', __FILE__ );
define( 'CUSTOMER_DATA_VERSION', '0.1.0' );

register_activation_hook( CUSTOMER_DATA_PLUGIN_FILE, 'customer_data_add_options' );

/**
 * Add plugin options on activation
 *
 * @since 1.0.0
 * @return void
 */
function customer_data_add_options() {
	CustomerData\Options::add_options();
}

require_once 'utils.php';

add_action( 'init', 'customer_data_load_textdomain' );

/**
 * Load plugin text domain
 *
 * @since 1.0.0
 * @return void
 */
function customer_data_load_textdomain() {
	load_plugin_textdomain( 'customer-data', false, path_join( dirname( plugin_basename( CUSTOMER_DATA_PLUGIN_FILE ) ), '/languages' ) );
}

add_action(
	'plugins_loaded',
	'customer_data_plugin_loaded',
);

/**
 * Load plugin
 *
 * @since 1.0.0
 * @return void
 */
function customer_data_plugin_loaded() {
	CustomerData\Editor::register_hooks();
	CustomerData\Options::register_hooks();
	CustomerData\Keyset::register_hooks();
	CustomerData\Temp_Keys::register_hooks();
	CustomerData\Shortcodes::register_hooks();
	CustomerData\Swift_API::register_hooks();
	CustomerData\Token_Loader::register_hooks();
	CustomerData\Interactivity::register_hooks();
	CustomerData\Users_Page::register_hooks();

	CustomerData\Settings_Page::register_hooks();
	CustomerData\Tools_Page::register_hooks();
	CustomerData\Tool_Create_Token::register_hooks();
	CustomerData\Tool_Inspect_Token::register_hooks();
}
