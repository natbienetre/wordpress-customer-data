/**
 * File Upload Delete Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block provides a delete button for uploaded files.
 */

import { type BlockConfiguration, registerBlockType } from '@wordpress/blocks';
import { Save } from './save';
import { Edit, type Attributes } from './edit';
import metadata from './block.json';

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save: Save,
} as BlockConfiguration< Attributes > );
