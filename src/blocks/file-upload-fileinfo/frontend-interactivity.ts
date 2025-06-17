/**
 * VFS Upload Handler
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description Handles file uploads to Swift storage.
 */

import { store, getContext } from '@wordpress/interactivity';
import { pathJoin } from '../../libs/js/swift';
import type { FileContext, FileUploadContext, VfsState } from '../type';

const { state } = store( 'vfs', {
	state: {
		loaded: () => undefined !== state.files,
		downloadUrl: () => {
			const context = getContext< FileContext >();
			return state
				.configuration!.fileURLForMethod(
					context.file.remotePath,
					'GET'
				)
				.toString();
		},
		localFiles: () => {
			const context = getContext< FileUploadContext >();
			const prefix = pathJoin( context.pageSpace, context.destination );
			return state.files?.filter( ( file ) =>
				file.remotePath.startsWith( prefix )
			);
		},
	},
	context: {
		ready: false,
	},
} ) as unknown as {
	state: VfsState;
};
