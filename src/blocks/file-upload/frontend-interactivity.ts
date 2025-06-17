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
	getElement,
	withScope,
	withSyncEvent,
	splitTask,
} from '@wordpress/interactivity';
import { pathJoin } from '../../libs/js/swift';
import type {
	FileUploadContext,
	FileWithStatus,
	RemoteFile,
	VfsActions,
	VfsState as VfsStateBase,
} from '../type';
import { addFiles, updateFile } from '../lib';
import { addInitCallback } from '../event';
import { name } from './block.json';
import type { TokenV1 } from 'token';

type VfsState = VfsStateBase & {
	ready: () => boolean;
	canWrite: () => boolean;
};

const { actions, state } = store( 'vfs', {
	state: {
		ready: (): boolean => state.tokenIs( 'valid' ),
		canWrite: (): boolean =>
			state.ready() &&
			'PUT' in ( state.token as TokenV1 )?.swift.signatures,
	},
	callbacks: {
		upload: withSyncEvent( function* ( event: Event ) {
			event.preventDefault();
			event.stopPropagation();

			yield splitTask();

			const context = getContext< FileUploadContext >();

			const element = getElement().ref as HTMLInputElement;

			const acceptTypes = context.accept;

			const filesToUpload = Array.from( element.files ?? [] ).map(
				( file ) => ( {
					blob: file as Blob,
					name: file.name,
					creationDate: new Date(),
					size: file.size,
					type: file.type,
					uploaded: 0,
					status: 'pending' as const,
					error: null,
					remotePath: pathJoin(
						context.pageSpace,
						context.destination,
						1 === context.nbFiles
							? ''
							: encodeURIComponent( file.name )
					),
				} )
			) as ( RemoteFile & { blob: Blob } )[];

			// TODO: check context.extractArchive and extract files from archive if needed https://docs.openstack.org/swift/latest/middleware.html#extract-archive

			addFiles( ...filesToUpload );

			element.value = '';

			const validate = validateFile( acceptTypes );

			return Promise.all(
				filesToUpload.map( ( file ) => {
					/*
					if (
						context.nbFiles > 0 &&
						filesToUpload.length +
							Object.keys( state.files ).filter(
								( file ) =>
									state.files[ file ].status !== 'error'
							).length >
							context.nbFiles
					) {
						state.files[ file.name ].error = 'too-many-files';
						context.files = Object.values( state.files );
						return Promise.resolve();
					}
					*/

					if ( ! validate( file ) ) {
						updateFile( file.remotePath, {
							error: 'invalid-file-type',
							status: {
								inProgress: false,
								error: true,
								success: false,
							},
						} );

						return Promise.resolve();
					}

					updateFile( file.remotePath, {
						status: {
							inProgress: true,
							error: false,
							success: false,
						},
						error: null,
					} );

					const remotePath = file.remotePath;

					return state.swiftFile
						?.upload(
							remotePath,
							file,
							withScope( ( uploaded: number ) =>
								updateFile( remotePath, {
									uploaded,
								} )
							)
						)
						.then(
							withScope( () => {
								updateFile( remotePath, {
									status: {
										inProgress: false,
										error: false,
										success: true,
									},
									uploaded: file.size,
								} );
							} )
						)
						.catch(
							withScope( ( err: any ) => {
								updateFile( remotePath, {
									status: {
										inProgress: false,
										error: true,
										success: false,
									},
									error: 'upload-failed',
								} );

								throw err;
							} )
						);
				} )
			).finally( withScope( actions.updateFileInventory ) );
		} ),
	},
	actions: {
		updateFileInventory: async () => {
			const context = getContext< FileUploadContext >();

			const content = JSON.stringify(
				state
					.files!.filter( ( file ) =>
						file.remotePath.startsWith(
							pathJoin( context.pageSpace, context.destination )
						)
					)
					.map( ( file ) => file.remotePath )
			);

			return state.swiftFile?.upload( context.filesInventoryRemotePath!, {
				blob: new Blob( [ content ] ),
				creationDate: new Date(),
				name: '.files.json',
				size: content.length,
				type: 'application/json',
				remotePath: context.filesInventoryRemotePath!,
			} );
		},
	},
} ) as unknown as {
	state: VfsState;
	actions: VfsActions;
};

const validateFile = ( acceptTypes: string[] ) =>
	acceptTypes.length > 0 && acceptTypes[ 0 ] !== '*'
		? ( file: { type: string; name: string } ) => {
				const fileExtension =
					'.' + file.name.split( '.' ).pop()?.toLowerCase();
				const fileType = file.type;

				return acceptTypes.some( ( type ) => {
					if ( type.startsWith( '.' ) ) {
						return type.toLowerCase() === fileExtension;
					}
					if ( type.includes( '/*' ) ) {
						const baseType = type.split( '/' )[ 0 ];
						return fileType.startsWith( baseType + '/' );
					}
					return type === fileType;
				} );
		  }
		: () => true;

addInitCallback( name, () => {
	withScope( () => {
		const context = getContext< FileUploadContext >();
		context.filesInventoryRemotePath = pathJoin(
			context.pageSpace,
			'.files.json'
		);
		state
			.swiftFile!.read( context.filesInventoryRemotePath )
			.then( JSON.parse )
			.then( ( remotePaths: string[] ) =>
				Promise.all(
					remotePaths.map( ( remotePath ) =>
						state.swiftFile!.get( remotePath ).then(
							( file ) =>
								( {
									...file,
									status: {
										success: true,
									},
									error: null,
									uploaded: file.size,
								} ) as FileWithStatus
						)
					)
				).then( ( files: FileWithStatus[] ) => addFiles( ...files ) )
			)
			.catch( ( err ) => {
				if ( 404 === err.status ) {
					// no previous files, continue
					return;
				}
				throw err;
			} )
			.then(
				withScope( () => {
					getContext< FileUploadContext >().ready = true;
				} )
			);
	} );
} );
