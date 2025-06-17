/**
 * File Upload Info Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block displays information about uploaded files.
 */

import { type BlockConfiguration, registerBlockType } from '@wordpress/blocks';
import { Edit } from './edit';
import { Save } from './save';
import metadata from './block.json';

export default metadata.name;

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save: Save,
} as BlockConfiguration< {} > );
