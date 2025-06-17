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
import metadata from './block.json';
import { Save } from './save';

import './admin.scss';
import { Attributes, Edit } from './edit';

export default metadata.name;

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save: Save,
} as BlockConfiguration< Attributes > );
