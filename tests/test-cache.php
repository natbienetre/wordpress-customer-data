<?php
/**
 * Class TestCache
 *
 * @package CustomerData
 */

/**
 * Test case for Cache class.
 */
class TestCache extends WP_UnitTestCase {

	/**
	 * Test cache group constant.
	 */
	public function test_cache_group_constant() {
		$this->assertEquals( 'customer-data', CustomerData\Cache::GROUP );
	}

	/**
	 * Test setting and getting a value from cache.
	 */
	public function test_set_and_get_cache() {
		$key = 'test_key';
		$value = 'test_value';
		$expiration = 3600;

		// Set value in cache
		CustomerData\Cache::set( $key, $value, $expiration );

		// Get value from cache
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );

		$this->assertEquals( $value, $cached_value );
		$this->assertTrue( $found );
	}

	/**
	 * Test getting non-existent cache key.
	 */
	public function test_get_non_existent_key() {
		$key = 'non_existent_key';
		$found = false;

		$cached_value = CustomerData\Cache::get( $key, false, $found );

		$this->assertFalse( $cached_value );
		$this->assertFalse( $found );
	}

	/**
	 * Test getting cache with force parameter.
	 */
	public function test_get_cache_with_force() {
		$key = 'force_test_key';
		$value = 'force_test_value';

		// Set value in cache
		CustomerData\Cache::set( $key, $value );

		// Get value with force parameter
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, true, $found );

		$this->assertEquals( $value, $cached_value );
		$this->assertTrue( $found );
	}

	/**
	 * Test setting cache with default expiration.
	 */
	public function test_set_cache_default_expiration() {
		$key = 'default_expiration_key';
		$value = 'default_expiration_value';

		// Set value without specifying expiration
		CustomerData\Cache::set( $key, $value );

		// Get value from cache
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );

		$this->assertEquals( $value, $cached_value );
		$this->assertTrue( $found );
	}

	/**
	 * Test setting cache with zero expiration.
	 */
	public function test_set_cache_zero_expiration() {
		$key = 'zero_expiration_key';
		$value = 'zero_expiration_value';

		// Set value with zero expiration
		CustomerData\Cache::set( $key, $value, 0 );

		// Get value from cache
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );

		$this->assertEquals( $value, $cached_value );
		$this->assertTrue( $found );
	}

	/**
	 * Test setting cache with custom expiration.
	 */
	public function test_set_cache_custom_expiration() {
		$key = 'custom_expiration_key';
		$value = 'custom_expiration_value';
		$expiration = 7200; // 2 hours

		// Set value with custom expiration
		CustomerData\Cache::set( $key, $value, $expiration );

		// Get value from cache
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );

		$this->assertEquals( $value, $cached_value );
		$this->assertTrue( $found );
	}

	/**
	 * Test deleting cache key.
	 */
	public function test_delete_cache_key() {
		$key = 'delete_test_key';
		$value = 'delete_test_value';

		// Set value in cache
		CustomerData\Cache::set( $key, $value );

		// Verify value exists
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );
		$this->assertEquals( $value, $cached_value );
		$this->assertTrue( $found );

		// Delete value from cache
		CustomerData\Cache::delete( $key );

		// Verify value is deleted
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );
		$this->assertFalse( $cached_value );
		$this->assertFalse( $found );
	}

	/**
	 * Test deleting non-existent cache key.
	 */
	public function test_delete_non_existent_key() {
		$key = 'non_existent_delete_key';

		// Delete non-existent key should not throw error
		CustomerData\Cache::delete( $key );

		// Verify key still doesn't exist
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );
		$this->assertFalse( $cached_value );
		$this->assertFalse( $found );
	}

	/**
	 * Test cache with different data types.
	 */
	public function test_cache_different_data_types() {
		$test_cases = array(
			'string' => 'test_string',
			'integer' => 123,
			'float' => 123.45,
			'boolean' => true,
			'array' => array( 'key' => 'value', 'number' => 42 ),
			'object' => (object) array( 'property' => 'value' ),
			'null' => null,
		);

		foreach ( $test_cases as $type => $value ) {
			$key = "test_{$type}_key";

			// Set value in cache
			CustomerData\Cache::set( $key, $value );

			// Get value from cache
			$found = false;
			$cached_value = CustomerData\Cache::get( $key, false, $found );

			$this->assertEquals( $value, $cached_value, "Failed for data type: {$type}" );
			$this->assertTrue( $found, "Found flag should be true for data type: {$type}" );
		}
	}

	/**
	 * Test cache key uniqueness.
	 */
	public function test_cache_key_uniqueness() {
		$key1 = 'unique_key_1';
		$key2 = 'unique_key_2';
		$value1 = 'value_1';
		$value2 = 'value_2';

		// Set different values for different keys
		CustomerData\Cache::set( $key1, $value1 );
		CustomerData\Cache::set( $key2, $value2 );

		// Get values and verify they are different
		$found1 = false;
		$found2 = false;
		$cached_value1 = CustomerData\Cache::get( $key1, false, $found1 );
		$cached_value2 = CustomerData\Cache::get( $key2, false, $found2 );

		$this->assertEquals( $value1, $cached_value1 );
		$this->assertEquals( $value2, $cached_value2 );
		$this->assertNotEquals( $cached_value1, $cached_value2 );
		$this->assertTrue( $found1 );
		$this->assertTrue( $found2 );
	}

	/**
	 * Test cache overwrite functionality.
	 */
	public function test_cache_overwrite() {
		$key = 'overwrite_test_key';
		$value1 = 'original_value';
		$value2 = 'updated_value';

		// Set initial value
		CustomerData\Cache::set( $key, $value1 );

		// Verify initial value
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );
		$this->assertEquals( $value1, $cached_value );
		$this->assertTrue( $found );

		// Overwrite with new value
		CustomerData\Cache::set( $key, $value2 );

		// Verify updated value
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );
		$this->assertEquals( $value2, $cached_value );
		$this->assertTrue( $found );
		$this->assertNotEquals( $value1, $cached_value );
	}

	/**
	 * Test cache with empty string key.
	 */
	public function test_cache_empty_string_key() {
		$key = '';
		$value = 'empty_key_value';

		// Set value with empty key
		CustomerData\Cache::set( $key, $value );

		// Get value from cache
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );

		$this->assertEquals( $value, $cached_value );
		$this->assertTrue( $found );
	}

	/**
	 * Test cache with special characters in key.
	 */
	public function test_cache_special_characters_key() {
		$key = 'special_chars_key_!@#$%^&*()_+-=[]{}|;:,.<>?';
		$value = 'special_chars_value';

		// Set value with special characters in key
		CustomerData\Cache::set( $key, $value );

		// Get value from cache
		$found = false;
		$cached_value = CustomerData\Cache::get( $key, false, $found );

		$this->assertEquals( $value, $cached_value );
		$this->assertTrue( $found );
	}
}
