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
//import { humanTimeDiff } from '@wordpress/date';
import type { FileContext } from '../type';
import { formatFileSize } from '../../libs/js/format';

store( 'customer-data', {
	state: {
		humanReadableSize: (): string => {
			const context = getContext< FileContext >();
			return formatFileSize( context.file.size );
		},
	},
} );
