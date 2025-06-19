/**
 * File Upload Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block allows users to upload files.
 */

import { useBlockProps } from '@wordpress/block-editor';

export const Save: React.FC< {
	attributes: {
		placeholder: string;
		type: string;
		autopopulate: boolean;
	};
} > = ( { attributes } ) => {
	const blockProps = useBlockProps.save();

	if ( attributes.autopopulate ) {
		blockProps[ 'data-wp-bind--value' ] = 'state.encodedToken';
	}

	return (
		<input
			type={ attributes.type }
			placeholder={ attributes.placeholder }
			data-wp-interactive="customer-data"
			data-wp-on-async--input="actions.updateToken"
			{ ...blockProps }
		/>
	);
};
