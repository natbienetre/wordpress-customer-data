<?php
/**
 * Shortcodes Handler
 *
 * @package VFS
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 */

namespace VFS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Shortcodes
 *
 * @since 1.0.0
 */
class Shortcodes {
	const SCRIPT_HANDLE = 'vfs-shortcodes';
	const STYLE_HANDLE  = 'vfs-shortcodes';

	/**
	 * Initialize the shortcodes
	 *
	 * @since 1.0.0
	 */
	public static function register_hooks() {
		$instance = new self();

		add_shortcode( 'token', array( $instance, 'render_token' ) );
		add_shortcode( 'valid-token', array( $instance, 'render_valid_token' ) );
		add_shortcode( 'invalid-token', array( $instance, 'render_invalid_token' ) );
		add_action( 'wp_enqueue_scripts', array( $instance, 'enqueue_scripts' ) );
		add_filter( 'vfs_interactivity_state', array( $instance, 'interactivity_state' ) );
	}

	/**
	 * Enqueue required scripts
	 *
	 * @since 1.0.0
	 */
	public function enqueue_scripts() {
		$err = Scripts::register_with_assets( self::SCRIPT_HANDLE, 'shortcodes/token-field.asset.php', true, array() );
		if ( is_wp_error( $err ) ) {
			error_log_debug( $err->get_error_message() );
		}
	}

	/**
	 * Interactivity state
	 *
	 * @since 1.0.0
	 * @param array $state The state.
	 * @return array Modified state.
	 */
	public function interactivity_state( $state ) {
		$loader = new Token_Loader();
		$token  = $loader->get();
		if ( is_wp_error( $token ) ) {
			error_log_debug( $token->get_error_message() . ' ' . wp_json_encode( $token->get_error_data() ) );
			$state['tokenIsValid'] = false;
		} elseif ( empty( $token ) ) {
			$state['tokenIsValid'] = false;
		} else {
			$state['tokenIsValid'] = true;
			$state['token']        = $token;
		}

		$state['encodedToken'] = $loader->get_jwt_token();

		return $state;
	}

	/**
	 * Render valid token
	 *
	 * @since 1.0.0
	 * @param array  $atts    Shortcode attributes.
	 * @param string $content Shortcode content.
	 * @return string The shortcode output
	 */
	public function render_valid_token( $atts, $content ) {
		wp_enqueue_script( self::SCRIPT_HANDLE );
		wp_enqueue_style( self::STYLE_HANDLE );

		return '<div data-wp-interactive="vfs" data-wp-style--display="state.tokenIsValid ? \'unset\' : \'none\'">' . do_shortcode( $content ) . '</div>';
	}

	/**
	 * Render invalid token
	 *
	 * @since 1.0.0
	 * @param array  $atts    Shortcode attributes.
	 * @param string $content Shortcode content.
	 * @return string The shortcode output
	 */
	public function render_invalid_token( $atts, $content ) {
		wp_enqueue_script( self::SCRIPT_HANDLE );
		wp_enqueue_style( self::STYLE_HANDLE );

		return '<div data-wp-interactive="vfs" data-wp-class--display-none="state.tokenIsValid">' . do_shortcode( $content ) . '</div>';
	}

	/**
	 * Render the token field shortcode.
	 * Note: the shortcode content is dropped.
	 *
	 * @since 1.0.0
	 * @param array $atts Shortcode attributes.
	 * @return string The shortcode output
	 */
	public function render_token( $atts ) {
		$atts = shortcode_atts(
			array(
				'field' => 'user',
			),
			$atts,
			'vfs_token_field'
		);

		wp_enqueue_script( self::SCRIPT_HANDLE );
		wp_enqueue_style( self::STYLE_HANDLE );

		return '<span
			data-wp-interactive="vfs"
			data-wp-text="state.token.' . esc_js( $atts['field'] ) . '"
			class="vfs-token-field vfs-token-field-' . esc_attr( strtolower( str_replace( '.', '-', $atts['field'] ) ) ) . '"
		></span>';
	}
}
