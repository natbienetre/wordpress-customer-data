/**
 * File Upload Info Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block displays information about uploaded files.
 */

import { useBlockProps } from '@wordpress/block-editor';
import { Attributes } from './edit';

export const Save: React.FC< {
	attributes: Attributes;
} > = ( { attributes } ) => {
	const blockProps = useBlockProps.save();
	const { relative } = attributes;

	if ( relative ) {
		blockProps[ 'data-wp-text' ] = 'customer-data::state.relativeTime';
		blockProps[ 'data-wp-bind--title' ] = 'customer-data::state.absoluteTime';
		blockProps[ 'data-toggle' ] = 'tooltip';
	} else {
		blockProps[ 'data-wp-text' ] = 'customer-data::state.absoluteTime';
	}

	return <span { ...blockProps } />;
};
