/**
 * VFS Upload Handler
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description Handles file uploads to Swift storage.
 */

import {
	store,
	getContext,
	withSyncEvent,
	splitTask,
	withScope,
} from '@wordpress/interactivity';
import type { FileContext, VfsActions, VfsState } from '../type';
import { removeFile, updateFile } from '../lib';
import { deleteConfirmation, deleteTitle } from './strings';

const { actions, state } = store( 'vfs', {
	state: {
		deleteTitle: () => {
			const context = getContext< FileContext >();
			return deleteTitle( context.file.name );
		},
	},
	actions: {
		delete: withSyncEvent( function* ( event: Event ) {
			event.preventDefault();
			event.stopPropagation();

			yield splitTask();

			const context = getContext<
				FileContext & {
					confirmationDialog: boolean;
					status: 'deleting' | 'deleted' | 'error';
				}
			>();

			if ( context.confirmationDialog ) {
				if (
					// eslint-disable-next-line no-alert
					! confirm( deleteConfirmation( context.file.name ) )
				) {
					return;
				}
			}

			const remotePath = context.file.remotePath;

			context.file.status.inProgress = true;

			( state as VfsState ).swiftFile
				?.delete( remotePath )
				.then( () => {
					removeFile( remotePath );
				} )
				.catch( () => {
					updateFile( remotePath, {
						error: 'delete-failed',
					} );
				} )
				.finally( withScope( actions.updateFileInventory ) );
		} ),
	},
} ) as unknown as {
	state: VfsState;
	actions: VfsActions;
};
