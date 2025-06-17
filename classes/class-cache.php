<?php
/**
 * VFS options class
 *
 * @package VFS
 * @version 1.0.0
 * @author  Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace VFS;

/**
 * Options class
 *
 * @package VFS
 * @version 1.0.0
 * @author  Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */
class Cache {
	const GROUP = 'vfs';

	/**
	 * Get value from cache
	 *
	 * @since 1.0.0
	 * @param string $key Cache key.
	 * @param bool   $force Whether to force an update of the local cache.
	 * @param bool   $found Whether the key was found in the cache.
	 * @return mixed Cache value.
	 */
	public static function get( $key, $force = false, &$found = null ) {
		return wp_cache_get( $key, self::GROUP, $force, $found );
	}

	/**
	 * Set value in cache
	 *
	 * @since 1.0.0
	 * @param string $key Cache key.
	 * @param mixed  $value Cache value.
	 * @param int    $expiration Cache expiration in seconds.
	 * @return void
	 */
	public static function set( $key, $value, $expiration = 0 ) {
		wp_cache_set( $key, $value, self::GROUP, $expiration );
	}

	/**
	 * Delete value from cache
	 *
	 * @since 1.0.0
	 * @param string $key Cache key.
	 * @return void
	 */
	public static function delete( $key ) {
		wp_cache_delete( $key, self::GROUP );
	}
}
