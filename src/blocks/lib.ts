import {
	getConfig,
	getContext,
	store,
	withScope,
} from '@wordpress/interactivity';
import {
	FileWithStatus,
	PostContext,
	RemoteFile,
	Status,
	VfsConfig,
	VfsState,
} from './type';
import { addInitCallback, InitAction } from './event';
import hooks from '../libs/js/wordpress-interactive/hooks';
import { VfsConfiguration } from '../libs/js/configuration';
import { SwiftFile } from '../libs/js/file-upload';
import { getToken } from '../libs/js/global-token';
import { Token } from '../libs/js/token';
import wordpressUrl from '../libs/js/wordpress-interactive/url';
import { apiFetch } from '../libs/js/wordpress-interactive/api-fetch';

const { actions, state } = store( 'vfs', {
	state: {
		// Optimistically assume the token is valid if it is present in the query param
		//tokenIsValid:
		//	null !==
		// 	new URLSearchParams( window.location.search ).get( 'vfs_token' ),
		tokenIs: ( visibility: 'valid' | 'invalid' | 'loading' ) => {
			switch ( visibility ) {
				case 'loading':
					return null === state.token;
				case 'valid':
					return null !== state.token && false !== state.token;
				case 'invalid':
					return false === state.token;
			}
		},
		files: undefined,
		token: null,
		configuration: null,
		swiftFile: null,
	} as VfsState,
	actions: {
		populate: () => {
			if ( ! state.tokenIs( 'valid' ) ) {
				return;
			}

			const context = getContext< PostContext >();

			state
				.swiftFile!.read( context.filesInventoryRemotePath )
				.then( JSON.parse )
				.then( ( remotePaths: string[] ) => {
					state.files = [];
					return Promise.all(
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
					).then( ( files: FileWithStatus[] ) =>
						addFiles( ...files )
					);
				} )
				.catch( ( err ) => {
					state.files = [];
					if ( 404 === err.status ) {
						// no previous files, continue
						return;
					}

					// TODO: handle configuration errors

					throw err;
				} );
		},
		reset: async () => {
			state.token = null;
			state.files = undefined;
			state.swiftFile = null;
			state.configuration = null;
		},
		updateTokenFromQueryParams: async () => {
			const config = getConfig( 'vfs' ) as VfsConfig;
			if ( config.keySet ) {
				window.vfsKeys = config.keySet;
			}
			actions
				.reset()
				.then( () => getToken( window, apiFetch ) )
				.then( ( token ) => {
					const configuration = new VfsConfiguration(
						new Token( token ),
						config,
						wordpressUrl
					);
					const swiftFile = new SwiftFile(
						configuration,
						wordpressUrl
					);

					state.configuration = configuration;
					state.swiftFile = swiftFile;
					state.token = token;
				} )
				.then( actions.populate )
				.catch( ( error ) => {
					state.token = false;
					throw error;
				} )
				.finally( () => {
					hooks.doAction( InitAction );
				} );
		},
		init: async () => {
			addInitCallback(
				'vfs-init-context',
				withScope( actions.populate )
			);

			actions.updateTokenFromQueryParams();
		},
	},
} );

export const addFile = ( file: FileWithStatus ) => {
	const existingFile = state.files!.findIndex(
		( f: FileWithStatus ) => f.remotePath === file.remotePath
	);
	if ( existingFile !== -1 ) {
		state.files![ existingFile ] = file;
	} else {
		state.files!.push( file );
	}
};

export const addFiles = ( ...files: RemoteFile[] ) => {
	files.forEach( ( file ) =>
		addFile( {
			status: {
				inProgress: false,
				error: false,
				success: false,
				...( 'status' in file ? ( file.status as Status ) : {} ),
			},
			...file,
		} as FileWithStatus )
	);
};

export const updateFile = (
	remotePath: string,
	file: Partial< FileWithStatus >
) => {
	const existingFile = state.files?.findIndex(
		( f ) => f.remotePath === remotePath
	);
	if ( -1 === existingFile || undefined === existingFile ) {
		throw new Error( `File not found: ${ remotePath }` );
	}

	state.files![ existingFile ] = {
		...state.files![ existingFile ],
		...file,
	};
};

export const removeFile = ( file: RemoteFile | string ) => {
	if ( typeof file === 'string' ) {
		state.files = state.files?.filter( ( f ) => f.remotePath !== file );
	} else {
		state.files = state.files?.filter( ( f ) => f.name !== file.name );
	}
};
