/**
 * Sidebar registration
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This script registers the CustomerData sidebar in the WordPress editor.
 */

import { registerPlugin } from '@wordpress/plugins';
import { customLink } from '@wordpress/icons';
import type { WPPlugin } from '@wordpress/plugins';
import { Edit } from './edit';

type PluginSettings = Omit< WPPlugin, 'name' >;

const pluginConfig: PluginSettings = {
	render: Edit,
	icon: customLink,
};

export const enable = () => {
	registerPlugin( 'customer-data-temporary-url', pluginConfig );
};
