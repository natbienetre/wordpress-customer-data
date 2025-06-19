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
import type { FileContext } from '../file-upload/types';
import date from '../../libs/js/wordpress-interactive/date';

const settings = date.getSettings();

store( 'customer-data', {
	state: {
		relativeTime: () => {
			const context = getContext< FileContext >();
			return date.humanTimeDiff( context.file.creationDate, new Date() );
		},
		absoluteTime: () => {
			const context = getContext< FileContext >();

			return date.dateI18n(
				settings.formats.datetimeAbbreviated,
				context.file.creationDate,
				settings.timezone.string
			);
		},
	},
} );
