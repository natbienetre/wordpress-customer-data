<?php
/**
 * VFS plugin main file.
 *
 * @package VFS
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name:       Visitor FileSystem
 * Plugin URI:        https://github.com/natbienetre/wordpress-visitor-filesystem
 * Version:           0.1.0
 * GitHub Plugin URI: natbienetre/wordpress-visitor-filesystem
 * Funding URI:       https://github.com/sponsors/holyhope
 * Description:       Helps visitor to upload files and manage them.
 * Author:            @holyhope
 * Author URI:        https://github.com/holyhope
 * Text Domain:       vfs
 * Domain Path:       /languages
 */

/**
 * Autoload the classes
 */
require 'autoload.php';

define( 'VFS_PLUGIN_FILE', __FILE__ );
define( 'VFS_VERSION', '0.1.0' );

register_activation_hook( VFS_PLUGIN_FILE, 'vfs_add_options' );

/**
 * Add plugin options on activation
 *
 * @since 1.0.0
 * @return void
 */
function vfs_add_options() {
	VFS\Options::add_options();
}

require_once 'utils.php';

add_action( 'init', 'vfs_load_textdomain' );

/**
 * Load plugin text domain
 *
 * @since 1.0.0
 * @return void
 */
function vfs_load_textdomain() {
	load_plugin_textdomain( 'vfs', false, path_join( dirname( plugin_basename( VFS_PLUGIN_FILE ) ), '/languages' ) );
}

add_action(
	'plugins_loaded',
	'vfs_plugin_loaded',
);

/**
 * Load plugin
 *
 * @since 1.0.0
 * @return void
 */
function vfs_plugin_loaded() {
	VFS\Editor::register_hooks();
	VFS\Options::register_hooks();
	VFS\Keyset::register_hooks();
	VFS\Temp_Keys::register_hooks();
	VFS\Shortcodes::register_hooks();
	VFS\Swift_API::register_hooks();
	VFS\Token_Loader::register_hooks();
	VFS\Interactivity::register_hooks();
	VFS\Users_Page::register_hooks();

	VFS\Settings_Page::register_hooks();
	VFS\Tools_Page::register_hooks();
	VFS\Tool_Create_Token::register_hooks();
	VFS\Tool_Inspect_Token::register_hooks();
}
