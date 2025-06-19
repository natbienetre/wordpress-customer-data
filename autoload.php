<?php
/**
 * Autoloader for the plugin.
 *
 * @package CustomerData
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

/**
 * Add vendor autoload
 */
require_once 'vendor/autoload.php';

/**
 * Autoload the classes
 */
spl_autoload_register(
	static function ( $class_name ) {
		if ( 0 !== strpos( $class_name, 'CustomerData' ) ) {
			return;
		}

		// Trim the CustomerData prefix.
		$class_name = substr( $class_name, 4 );

		// Replace underscores with hyphens.
		$class_name = str_replace( '_', '-', $class_name );

		// Convert to lowercase.
		$class_name = strtolower( $class_name );

		// Load the class.
		require_once path_join( path_join( plugin_dir_path( CUSTOMER_DATA_PLUGIN_FILE ), 'classes' ), "class-{$class_name}.php" );
	}
);
