/**
 * File Upload Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block allows users to upload files.
 */

import { Attributes } from './edit';

export const addTokenVisibilityExtraProps = (
	props: any,
	_: any,
	attributes: Attributes &
		Partial< { style: Partial< { display: string } > } >
) => {
	if ( ! attributes ) {
		return props;
	}

	const { customerDataTokenShouldBe } = attributes;

	if ( customerDataTokenShouldBe.length === 0 ) {
		return props;
	}

	if ( attributes.style?.display && 'none' !== attributes.style.display ) {
		props[ 'data-customer-data-original-display' ] = attributes.style.display;
	}

	attributes.style = {
		...attributes.style,
		display: 'none',
	};

	props[ 'data-customer-data-token-should-be' ] = JSON.stringify( customerDataTokenShouldBe );

	props[ `data-wp-watch--customer-data-token-visibility` ] =
		'customer-data::callbacks.setVisilibity';

	return props;
};
