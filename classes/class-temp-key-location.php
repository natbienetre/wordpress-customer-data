<?php
/**
 * Class Temp_Key_Location
 *
 * @package VFS
 */

namespace VFS;

/**
 * Class Temp_Key_Location
 *
 * @package VFS
 */
class Temp_Key_Location {
	/**
	 * The location of the temp key.
	 *
	 * @var string Either 'account' or 'container'
	 */
	public string $location;

	/**
	 * The metadata key.
	 *
	 * @var string
	 */
	public string $metadata_key;

	const CONTEXT_ACCOUNT   = 'account';
	const CONTEXT_CONTAINER = 'container';

	const METADATA_KEY_1 = 'temp-url-key';
	const METADATA_KEY_2 = 'temp-url-key-2';

	/**
	 * Constructor.
	 *
	 * @param string $location The location of the temp key.
	 * @param string $metadata_key The metadata key.
	 */
	public function __construct( string $location, string $metadata_key ) {
		$this->location     = $location;
		$this->metadata_key = $metadata_key;
	}

	/**
	 * Return the location and metadata key as a string.
	 *
	 * @return string
	 */
	public function __toString() {
		return $this->location . '/' . $this->metadata_key;
	}
}
