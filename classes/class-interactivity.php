<?php
/**
 * Interactivity
 *
 * @package CustomerData
 */

namespace CustomerData;

/**
 * Interactivity
 *
 * @package CustomerData
 */
class Interactivity {

	/**
	 * Constructor
	 */
	public function __construct() {
	}

	/**
	 * Register hooks
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_hooks() {
		$instance = new self();

		add_filter( 'the_content', array( $instance, 'the_content' ) );
	}

	/**
	 * Add interactivity state
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function add_interactivity() {
		Scripts::enqueue_script( Editor::UPLOAD_BLOCK_FRONTEND_SCRIPT_HANDLE, 'blocks/lib.asset.php' );
		wp_interactivity_config(
			'customer-data',
			apply_filters( 'customer_data_interactivity_config', array() )
		);
		wp_interactivity_state(
			'customer-data',
			apply_filters( 'customer_data_interactivity_state', array() )
		);
	}

	/**
	 * Filter the content to add interactivity wrapper
	 *
	 * @since 1.0.0
	 * @param string $content The content to filter.
	 * @return string The filtered content.
	 */
	public function the_content( $content ) {
		$this->add_interactivity();

		$post_id = get_the_ID();

		$page_space = get_post_meta( $post_id, '_customer_data_subpath', true );

		$context = apply_filters(
			'customer_data_interactivity_context',
			array(
				'pageSpace'                => $page_space,
				'filesInventoryRemotePath' => Swift_Api::path_join( $page_space, '.files.json' ),
			),
			$post_id
		);

		return '<div data-wp-interactive="customer-data" data-wp-init="actions.init" ' . wp_interactivity_data_wp_context( $context ) . '>' .
			wp_interactivity_process_directives( $content ) .
			'</div>';
	}
}
