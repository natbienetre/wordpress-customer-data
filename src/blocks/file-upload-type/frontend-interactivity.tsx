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
import type { FileContext } from '../type';

store( 'customer-data', {
	state: {
		humanReadableFileType: () => {
			const context = getContext< FileContext >();
			return context.file.type;
		},
	},
} );
