/**
 * File Upload Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block allows users to upload files.
 */

import { type BlockConfiguration, registerBlockType } from '@wordpress/blocks';
import { Attributes, Edit } from './edit';
import { Save } from './save';
import metadata from './block.json';
import { __ } from '@wordpress/i18n';

import './admin.scss';

export default metadata.name;

registerBlockType( metadata.name, {
	edit: Edit,
	save: Save,
	attributes: {
		...metadata.attributes,
		placeholder: {
			...metadata.attributes.placeholder,
			default: __( 'Paste your token here', 'customer-data' ),
		},
	},
} as any as BlockConfiguration< Attributes > );
