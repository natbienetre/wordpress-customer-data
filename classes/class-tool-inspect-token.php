<?php
/**
 * Admin page class
 *
 * @package CustomerData
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace CustomerData;

use Jose\Component\Core\AlgorithmManager;
use Jose\Component\Signature\Algorithm\EdDSA;
use Jose\Component\Signature\Algorithm\ES256;
use Jose\Component\Signature\Algorithm\ES384;
use Jose\Component\Signature\Algorithm\ES512;
use Jose\Component\Signature\Algorithm\PS256;
use Jose\Component\Signature\Algorithm\PS384;
use Jose\Component\Signature\Algorithm\PS512;
use Jose\Component\Signature\Algorithm\RS256;
use Jose\Component\Signature\Algorithm\RS384;
use Jose\Component\Signature\Algorithm\RS512;
use Jose\Component\Signature\JWSTokenSupport;
use Jose\Component\Signature\JWSVerifier;
use Jose\Component\Signature\Serializer\CompactSerializer;
use Jose\Component\Signature\Serializer\JSONGeneralSerializer;
use Jose\Component\Signature\Serializer\JSONFlattenedSerializer;
use Jose\Component\Signature\Serializer\JWSSerializerManager;

/**
 * Class Tool_Inspect_Token
 *
 * @since 1.0.0
 */
class Tool_Inspect_Token {

	/**
	 * Admin settings script and style handle
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SCRIPT_HANDLE = 'customer-data-tool-inspect-token';

	/**
	 * Interactivity store namespace
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const INTERACTIVITY_STORE_NAMESPACE = 'customer-data-admin-tools-token-inspection';

	/**
	 * Token inspection input name
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const TOKEN_INSPECTION_INPUT_NAME = 'customer-data-token-inspection-token';

	/**
	 * Action name
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const ACTION_NAME = 'inspect_token';

	/**
	 * Nonce name
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const NONCE_NAME = 'customer-data-action-inspect-token';

	/**
	 * Load hook suffix
	 *
	 * @var string
	 */
	private $load_hook_suffix;

	/**
	 * Inspection result
	 *
	 * @var array|false
	 */
	protected $inspection_result = false;

	/**
	 * Register hooks
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_hooks() {
		add_action( 'admin_enqueue_scripts', array( self::class, 'register_admin_script' ) );
	}

	/**
	 * Register the admin script
	 */
	public static function register_admin_script() {
		$err = Scripts::register_with_assets( self::SCRIPT_HANDLE, 'admin-settings/tool-inspect-token-interactivity.asset.php' );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}

		$err = Scripts::register_with_assets( self::SCRIPT_HANDLE, 'admin-settings/tool-inspect-token.asset.php', true, array() );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}
	}

	/**
	 * Enqueue the admin script
	 */
	public function enqueue_admin_script() {
		Scripts::enqueue_style( self::SCRIPT_HANDLE );

		$err = Scripts::enqueue_script( self::SCRIPT_HANDLE, 'admin-settings/tool-inspect-token-interactivity.asset.php' );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}

		$err = Scripts::enqueue_script( self::SCRIPT_HANDLE, 'admin-settings/tool-inspect-token.asset.php' );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}
	}

	/**
	 * Load the token inspection tool
	 */
	public function load() {
		if ( isset( $_REQUEST['_wpnonce'] ) && ! wp_verify_nonce( $_REQUEST['_wpnonce'], self::NONCE_NAME ) ) {
			return;
		}

		if ( ! isset( $_REQUEST['action'] ) || self::ACTION_NAME !== $_REQUEST['action'] ) {
			return;
		}

		$this->action();
	}

	/**
	 * Inspect the token
	 */
	public function action() {
		$this->inspection_result = $this->token_data( $_REQUEST[ self::TOKEN_INSPECTION_INPUT_NAME ] ?? '' );
	}

	/**
	 * Render the token inspection form and result
	 */
	public function render() {
		$token_data = $this->inspection_result;
		$user_value = '';
		if ( ! empty( $_REQUEST[ self::TOKEN_INSPECTION_INPUT_NAME ] ) ) {
			$user_value = $_REQUEST[ self::TOKEN_INSPECTION_INPUT_NAME ];

			if ( ! $token_data ) {
				$token_data = $this->token_data( $user_value );
			}
		}
		wp_interactivity_state( self::INTERACTIVITY_STORE_NAMESPACE, array( 'dateFormat' => get_option( 'date_format' ) ) )
		?>
		<div id="customer-data-token-inspection-container" class="card"
			data-wp-interactive="<?php echo esc_attr( self::INTERACTIVITY_STORE_NAMESPACE ); ?>"
			<?php echo wp_interactivity_data_wp_context( array( 'token' => $token_data ) ); ?>>
			<h2 class="title"><?php esc_html_e( 'Token inspection', 'customer-data' ); ?></h2>
			<form id="customer-data-token-inspection-form" method="get">
				<input type="hidden" name="action" value="<?php echo esc_attr( self::ACTION_NAME ); ?>" />
				<input type="hidden" name="_wpnonce" value="<?php echo esc_attr( wp_create_nonce( self::NONCE_NAME ) ); ?>" />
				<p>
					<input
						id="customer-data-token-inspection-token"
						type="text"
						name="<?php echo esc_attr( self::TOKEN_INSPECTION_INPUT_NAME ); ?>"
						class="regular-text"
						value="<?php echo esc_attr( $user_value ); ?>"
						placeholder="<?php esc_attr_e( 'xxxxxheaderxxxxx.yyyyypayloadyyyyyy.zzzzzsignaturezzzzz', 'customer-data' ); ?>"
						data-wp-on--input="callbacks.inspectToken"
						data-wp-on--change="callbacks.pushHistory"
					/>
					<?php submit_button( __( 'Inspect', 'customer-data' ), 'primary', 'submit', false ); ?>
				</p>
			</form>
			<div id="customer-data-token-inspection-result" class="customer-data-token-inspection-result" data-wp-bind--hidden="!context.token" data-wp-class--customer-data-token-inspection-result-empty="!context.token" <?php echo $token_data ? '' : 'hidden=""'; ?>>
				<div class="customer-data-token-inspection-result-notices" data-wp-bind--hidden="!context.token.validity.notices.length">
					<template data-wp-each--notice="context.token.validity.notices">
						<div>
						<?php
						wp_admin_notice(
							'<p data-wp-text="context.notice"></p>',
							array(
								'type'               => 'error',
								'paragraph_wrap'     => false,
								'additional_classes' => array( 'inline' ),
							)
						);
						?>
						</div>
					</template>
					<?php if ( $token_data ) : ?>
						<?php foreach ( $token_data['validity']['notices'] as $notice ) : ?>
							<div data-wp-each-child>
								<?php
								wp_admin_notice(
									'<p data-wp-text="context.notice">' . esc_html( $notice ) . '</p>',
									array(
										'type'           => 'error',
										'paragraph_wrap' => false,
										'additional_classes' => array( 'inline' ),
									)
								);
								?>
							</div>
						<?php endforeach; ?>
					<?php endif; ?>
				</div>
				<div data-wp-bind--hidden="!context.token.payload" <?php echo empty( $token_data['payload'] ) ? '' : 'hidden=""'; ?> class="notice-success notice inline">
					<div class="customer-data-token-inspection-result-metadata">
						<?php esc_html_e( 'Version', 'customer-data' ); ?>
						<span
							class="customer-data-token-inspection-result-version"
							data-wp-text="context.token.payload.version"
						><?php echo esc_html( $token_data['payload']['version'] ?? '' ); ?></span>
						<span
							class="customer-data-token-inspection-result-algo"
							data-wp-text="context.token.metadata.algorithm"
						><?php echo esc_html( $token_data['metadata']['algorithm'] ?? '' ); ?></span>
					</div>
					<div class="customer-data-token-inspection-result-user"
						title="<?php echo esc_attr( $token_data['payload']['user']['id'] ?? '' ); ?>"
						data-wp-bind--title="context.token.payload.user.id"
					>
						<span data-wp-text="context.token.payload.user.displayName" class="customer-data-token-inspection-result-user-name"><?php echo esc_html( $token_data['payload']['user']['displayName'] ?? '' ); ?></span>
						<span data-wp-text="context.token.payload.user.email" class="customer-data-token-inspection-result-user-email"><?php echo esc_html( $token_data['payload']['user']['email'] ?? '' ); ?></span>
					</div>
					<div class="customer-data-token-inspection-result-expiry"><?php esc_html_e( 'Expires at ', 'customer-data' ); ?>
						<span
							class="customer-data-token-inspection-result-expiry-date <?php echo ( $token_data['payload']['swift']['expiresAt'] ?? 0 ) > time() ? '' : 'expired'; ?>"
							data-wp-text="state.expirationDate"
							data-wp-class--expired="state.expired"
						><?php echo esc_html( wp_date( get_option( 'date_format' ), $token_data['payload']['swift']['expiresAt'] ?? 0 ) ); ?></span>
					</div>
					<div class="customer-data-token-inspection-result-scope"><?php esc_html_e( 'Scope:', 'customer-data' ); ?>
						<span data-wp-text="context.token.payload.swift.pageSpace" data-wp-bind--hidden="!context.token.payload.swift.pageSpace" <?php echo empty( $token_data['payload']['swift']['pageSpace'] ) ? '' : 'hidden=""'; ?>><?php echo esc_html( $token_data['payload']['swift']['pageSpace'] ?? '' ); ?></span>
						<i data-wp-bind--hidden="context.token.payload.swift.pageSpace" <?php echo empty( $token_data['payload']['swift']['pageSpace'] ) ? 'hidden=""' : ''; ?>><?php esc_html_e( 'Unscoped', 'customer-data' ); ?></i>
					</div>
					<div class="customer-data-token-inspection-result-method"><?php esc_html_e( 'Methods:', 'customer-data' ); ?>
						<?php
						foreach ( Swift_Api::all_http_methods() as $method ) :
							?>
							<span class="customer-data-token-inspection-result-method-item <?php echo empty( $token_data['payload']['swift']['signatures'][ $method ] ) ? 'customer-data-denied-method' : 'customer-data-allowed-method'; ?>" data-wp-class--customer-data-allowed-method="context.token.payload.swift.signatures.<?php echo esc_js( $method ); ?>" data-wp-class--customer-data-denied-method="!context.token.payload.swift.signatures.<?php echo esc_js( $method ); ?>">
								<?php echo esc_html( $method ); ?>
							</span>
						<?php endforeach; ?>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Inspect token
	 *
	 * @since 1.0.0
	 * @param string $token Token.
	 * @return array|false Token data.
	 */
	public function token_data( $token ) {
		if ( empty( $token ) ) {
			return false;
		}

		$serializer_manager = new JWSSerializerManager(
			array(
				new CompactSerializer(),
				new JSONGeneralSerializer(),
				new JSONFlattenedSerializer(),
			)
		);

		try {
			$jws = $serializer_manager->unserialize( $token );
		} catch ( \Exception $e ) {
			return array(
				'payload'  => null,
				'validity' => array(
					'valid'   => false,
					// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					// translators: %s is the error message.
					'notices' => array( sprintf( __( 'Invalid token: %s', 'customer-data' ), esc_html( $e->getMessage() ) ) ),
				),
			);
		}

		$results = new \WP_Error();

		$data               = $results->get_all_error_data();
		$invalid_signatures = array_map(
			function ( $error ) {
				return $error['signature'];
			},
			$data
		);
		$valid_signatures   = array_filter(
			$jws->getSignatures(),
			function ( $signature ) use ( $invalid_signatures ) {
				return ! in_array( $signature, $invalid_signatures, true );
			}
		);

		$jws_verifier = new JWSVerifier(
			new AlgorithmManager(
				array(
					new EdDSA(),
					new ES256(),
					new ES384(),
					new ES512(),
					new PS256(),
					new PS384(),
					new PS512(),
					new RS256(),
					new RS384(),
					new RS512(),
				)
			)
		);

		$key_set = new Keyset();
		$key_set = $key_set->get_public_keyset();

		foreach ( $valid_signatures as $i => $signature ) {
			if ( ! $jws_verifier->verifyWithKeySet( $jws, $key_set, $i ) ) {
				$results->add(
					'signature_check',
					__( 'Invalid signature', 'customer-data' ),
					array(
						'token'     => $jws,
						'signature' => $jws->getSignature( $i ),
					)
				);
			}
		}

		$token_type = new JWSTokenSupport();

		if ( ! $token_type->supports( $jws ) ) {
			$results->add(
				'token_type_not_supported',
				__( 'Token type not supported', 'customer-data' ),
				array(
					'token' => $jws,
				)
			);
		} else {
			$protected   = array();
			$unprotected = array();
			$token_type->retrieveTokenHeaders( $jws, 0, $protected, $unprotected );

			$algorithm = $protected['alg'] ?? $unprotected['alg'] ?? null;
		}

		$payload = json_decode( $jws->getPayload(), true );

		return array(
			'payload'  => $payload,
			'metadata' => array(
				'algorithm' => $algorithm,
			),
			'validity' => array(
				'valid'   => null !== $payload,
				'notices' => $results->get_error_messages(),
			),
		);
	}
}
