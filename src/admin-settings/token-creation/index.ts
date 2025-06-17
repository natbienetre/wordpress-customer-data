import { customLink } from '@wordpress/icons';
import { registerPlugin, type WPPlugin } from '@wordpress/plugins';
import { Render } from './render';

type PluginSettings = Omit< WPPlugin, 'name' >;

const pluginConfig: PluginSettings = {
	render: Render,
	icon: customLink,
};

export const enable = () => {
	registerPlugin( 'vfs-token-creation', pluginConfig );
};
