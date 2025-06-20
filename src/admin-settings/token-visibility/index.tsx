/**
 * File Upload Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block allows users to upload files.
 */

import { addFilter } from '@wordpress/hooks';
import type { BlockConfiguration } from '@wordpress/blocks';
import { addTokenVisibilityExtraProps } from './save';
import {
	Attributes,
	withTokenShouldBeValidControls,
	GlobalTokenVisibilityHelper,
} from './edit';
import { registerPlugin } from '@wordpress/plugins';
import { people } from '@wordpress/icons';
import type { WPPlugin } from '@wordpress/plugins';

import './edit.scss';

export const addTokenVisibilityAttribute = (
	settings: BlockConfiguration< Attributes >
) => {
	return {
		...settings,
		attributes: {
			...settings.attributes,
			customerDataTokenShouldBe: {
				type: 'array',
				default: [],
			},
		},
	};
};

export const enable = () => {
	addFilter(
		'blocks.registerBlockType',
		'customer-data/visibility-valid-token',
		addTokenVisibilityAttribute
	);

	addFilter(
		'blocks.getSaveContent.extraProps',
		'customer-data/visibility-valid-token',
		addTokenVisibilityExtraProps
	);

	addFilter(
		'editor.BlockEdit',
		'customer-data/visibility-valid-token',
		withTokenShouldBeValidControls
	);

	registerPlugin( 'customer-data-token-visibility', pluginConfig );
};

type PluginSettings = Omit< WPPlugin, 'name' >;

const pluginConfig: PluginSettings = {
	render: GlobalTokenVisibilityHelper,
	// scope: 'edit-post',
	icon: people,
};
