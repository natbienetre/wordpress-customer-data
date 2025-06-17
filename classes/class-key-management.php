<?php
/**
 * Key Management class
 *
 * @package VFS
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace VFS;

/**
 * Class Key_Management
 *
 * @since 1.0.0
 */
class Key_Management {

	/**
	 * Whether key management is enabled
	 *
	 * @since 1.0.0
	 * @var bool
	 */
	public bool $enabled = true;

	/**
	 * Main key identifier
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public string $main_key = '';

	/**
	 * URL of the JWKS endpoint
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public string $jwks_url = '';

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 * @param bool   $enabled  Whether key management is enabled.
	 * @param string $main_key Main key identifier.
	 * @param string $jwks_url URL of the JWKS endpoint.
	 */
	public function __construct( bool $enabled, string $main_key, string $jwks_url ) {
		$this->enabled  = $enabled;
		$this->main_key = $main_key;
		$this->jwks_url = $jwks_url;
	}
}
