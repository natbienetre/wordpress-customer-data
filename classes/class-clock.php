<?php
/**
 * Clock class
 *
 * @package VFS
 */

namespace VFS;

use Psr\Clock\ClockInterface;

/**
 * Clock class
 *
 * @since 1.0.0
 */
class Clock implements ClockInterface {
	/**
	 * Get the current date and time
	 *
	 * @return \DateTimeImmutable The current date and time
	 */
	public function now(): \DateTimeImmutable {
		return new \DateTimeImmutable();
	}
}
