<?php
/**
 * Frontend class
 *
 * @package CustomerData
 */

namespace CustomerData;

use Jose\Component\Checker\ExpirationTimeChecker;
use Jose\Component\Checker\HeaderCheckerManagerFactory;
use Jose\Component\Core\AlgorithmManagerFactory;
use Jose\Component\Signature\Algorithm\EdDSA;
use Jose\Component\Signature\JWSLoaderFactory;
use Jose\Component\Signature\JWSVerifierFactory;
use Jose\Component\Signature\Serializer\CompactSerializer;
use Jose\Component\Signature\Serializer\JWSSerializerManagerFactory;

/**
 * Frontend class
 *
 * @package CustomerData
 */
class Token_Loader {
	/**
	 * Token query var
	 *
	 * @var string
	 */
	const TOKEN_QUERY_VAR = 'customer_data_token';

	/**
	 * JWS loader factory
	 *
	 * @var JWSLoaderFactory
	 */
	private $jws_loader_factory;

	/**
	 * Serializer manager factory
	 *
	 * @var JWSSerializerManagerFactory
	 */
	private $serializer_manager_factory;

	/**
	 * Algorithm manager factory
	 *
	 * @var AlgorithmManagerFactory
	 */
	private $algorithm_manager_factory;

	/**
	 * JWS verifier factory
	 *
	 * @var JWSVerifierFactory
	 */
	private $jws_verifier_factory;

	/**
	 * Header checker manager factory
	 *
	 * @var HeaderCheckerManagerFactory
	 */
	private $header_checker_manager_factory;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->serializer_manager_factory = new JWSSerializerManagerFactory();
		$this->serializer_manager_factory->add( new CompactSerializer() );

		$this->algorithm_manager_factory = new AlgorithmManagerFactory(
			array(
				new EdDSA(),
			)
		);

		$this->jws_verifier_factory = new JWSVerifierFactory( $this->algorithm_manager_factory );

		$this->header_checker_manager_factory = new HeaderCheckerManagerFactory();
		$clock                                = new Clock();
		$this->header_checker_manager_factory->add( 'alg', new ExpirationTimeChecker( $clock ) );

		$this->jws_loader_factory = new JWSLoaderFactory(
			$this->serializer_manager_factory,
			$this->jws_verifier_factory,
			$this->header_checker_manager_factory
		);
	}

	/**
	 * Register hooks
	 */
	public static function register_hooks() {
		$instance = new self();

		add_filter( 'query_vars', array( $instance, 'query_vars' ) );
	}

	/**
	 * Add the token query var
	 *
	 * @param array $qvars Query vars.
	 * @return array Modified query vars.
	 */
	public function query_vars( $qvars ) {
		$qvars[] = self::TOKEN_QUERY_VAR;
		return $qvars;
	}

	/**
	 * Get the token from the query var
	 *
	 * @return string|null
	 */
	public function get_jwt_token() {
		return get_query_var( self::TOKEN_QUERY_VAR, null );
	}

	/**
	 * Get the JWS loader
	 *
	 * @return \Jose\Component\Signature\JWSLoader|\WP_Error
	 */
	public function get_jws_loader() {
		try {
			return $this->jws_loader_factory->create(
				$this->serializer_manager_factory->names(),
				$this->algorithm_manager_factory->aliases(),
				$this->header_checker_manager_factory->aliases()
			);
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'invalid_configuration',
				__( 'Invalid configuration', 'customer-data' ),
				array(
					'cause' => $e->getMessage(),
				)
			);
		}
	}

	/**
	 * Get the token from the query var
	 *
	 * @return array|null|\WP_Error
	 */
	public function get() {
		$jwt_token = $this->get_jwt_token();
		if ( is_null( $jwt_token ) ) {
			return null;
		}

		$jws_loader = $this->get_jws_loader();
		if ( is_wp_error( $jws_loader ) ) {
			return $jws_loader;
		}

		$signature_index = -1;
		$key_set         = new Keyset();

		try {
			$jws = $jws_loader->loadAndVerifyWithKeySet( $jwt_token, $key_set->get_public_keyset(), $signature_index );
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'invalid_token',
				__( 'Invalid token', 'customer-data' ),
				array(
					'cause' => $e->getMessage(),
				)
			);
		}

		if ( -1 === $signature_index ) {
			return new \WP_Error(
				'invalid_token',
				__( 'Invalid token', 'customer-data' ),
				array(
					'cause' => 'no matching signature',
				)
			);
		}

		return $jws->getPayload();
	}
}
