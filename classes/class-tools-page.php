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

/**
 * Class Tools_Page
 *
 * @since 1.0.0
 */
class Tools_Page {

	/**
	 * Menu slug
	 *
	 * @var string
	 */
	const MENU_SLUG = 'customer-data-tools';

	/**
	 * Load hook suffix
	 *
	 * @var string
	 */
	private $load_hook_suffix;

	/**
	 * Create token tool
	 *
	 * @var Tool_Create_Token
	 */
	private $create_token_tool;

	/**
	 * Inspect token tool
	 *
	 * @var Tool_Inspect_Token
	 */
	private $inspect_token_tool;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->create_token_tool  = new Tool_Create_Token();
		$this->inspect_token_tool = new Tool_Inspect_Token();
	}

	/**
	 * Register hooks
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_hooks() {
		$instance = new self();

		add_action( 'admin_menu', array( $instance, 'add_admin_menu' ) );
		add_action( 'admin_init', array( $instance, 'admin_init' ) );
		add_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_admin_script' ) );
	}

	/**
	 * Load the tool
	 */
	public function load() {
		if ( ! isset( $_REQUEST['action'] ) ) {
			return;
		}

		do_action( "{$this->load_hook_suffix}_action_{$_REQUEST['action']}", $_REQUEST['action'] );
	}

	/**
	 * Add admin hooks
	 */
	public function admin_init() {
		add_action( "load-{$this->load_hook_suffix}", array( $this, 'load' ) );
		add_action( $this->load_hook_suffix, array( $this, 'render_page' ) );

		add_action( 'tool_box', array( $this->create_token_tool, 'render' ) );
		add_action( 'load-tools.php', array( $this->create_token_tool, 'load' ) );
		add_action( "{$this->load_hook_suffix}_action_" . Tool_Create_Token::ACTION_NAME, array( $this->create_token_tool, 'action' ) );

		add_action( 'tool_box', array( $this->inspect_token_tool, 'render' ) );
		add_action( 'load-tools.php', array( $this->inspect_token_tool, 'load' ) );
		add_action( "{$this->load_hook_suffix}_action_" . Tool_Inspect_Token::ACTION_NAME, array( $this->inspect_token_tool, 'action' ) );
	}

	/**
	 * Enqueue admin scripts
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page.
	 * @return void
	 */
	public function enqueue_admin_script( $hook ) {
		if ( ! in_array( $hook, array( $this->load_hook_suffix, 'tools.php' ), true ) ) {
			return;
		}

		$this->create_token_tool->enqueue_admin_script();
		$this->inspect_token_tool->enqueue_admin_script();
	}

	/**
	 * Add admin menu
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function add_admin_menu() {
		$this->load_hook_suffix = add_management_page(
			__( 'Visitor Filesystem', 'customer-data' ),
			__( 'Visitor Filesystem', 'customer-data' ),
			'manage_options',
			self::MENU_SLUG,
			array( $this, 'render_page' )
		);
	}

	/**
	 * Options page
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function render_page() {
		?>
		<h1><?php esc_html_e( 'Visitor Filesystem tools', 'customer-data' ); ?></h1>

		<div class="wrap" id="customer-data-content">
			<div id="customer-data-tools-container">
				<?php $this->create_token_tool->render(); ?>
				<?php $this->inspect_token_tool->render(); ?>
			</div>
		</div>
		<?php
	}
}
