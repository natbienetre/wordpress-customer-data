/**
 * CustomerData Upload Handler
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description Handles file uploads to Swift storage.
 */

import { store, getContext } from '@wordpress/interactivity';
import type { FileContext, CustomerDataState } from '../type';
import { __, sprintf } from '../../libs/js/wordpress-interactive/i18n';

const { state } = store( 'customer-data', {
	state: {
		downloadTitle: () => {
			const context = getContext< FileContext >();
			return sprintf(
				// translators: %s is the name of the file.
				__( 'Download %s', 'customer-data' ),
				context.file.name
			);
		},
		downloadUrl: () => {
			const context = getContext< FileContext >();
			return state
				.configuration!.fileURLForMethod(
					context.file.remotePath,
					'GET'
				)
				.toString();
		},
		getBasename: (): string => {
			const context = getContext< FileContext >();

			const lastIndexOfDot = context.file.name.lastIndexOf( '.' );

			if ( lastIndexOfDot === -1 ) {
				return context.file.name;
			}

			return context.file.name.substring( 0, lastIndexOfDot );
		},
	},
} ) as unknown as {
	state: CustomerDataState;
};
