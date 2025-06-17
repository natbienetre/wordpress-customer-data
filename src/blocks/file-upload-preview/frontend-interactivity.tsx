/**
 * VFS Upload Handler
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description Handles file uploads to Swift storage.
 */

import { store, getContext, getElement } from '@wordpress/interactivity';
import { FileContext as _FileContext } from '../type';
import type { VfsState } from '../type';
import { fileTypeDashicon } from '../../libs/js/icon';

type FileContext = {
	file: {
		readUri: string;
	};
} & _FileContext;

const isImage = ( file: FileContext[ 'file' ] ) => {
	return (
		file.type.startsWith( 'image/' ) ||
		file.name.endsWith( '.png' ) ||
		file.name.endsWith( '.jpg' ) ||
		file.name.endsWith( '.jpeg' ) ||
		file.name.endsWith( '.gif' )
	);
};

const { actions, state } = store( 'vfs', {
	state: {
		previewURL: (): string => {
			const context = getContext< FileContext >();

			if ( ! isImage( context.file ) ) {
				return '';
			}

			const readUri = (
				state as VfsState
			 ).configuration!.fileURLForMethod(
				context.file.remotePath,
				'GET'
			);
			readUri.searchParams.set( 'ts', new Date().getTime().toString() );
			return readUri.toString();
		},
		dashicon: () => {
			const context = getContext< FileContext >();

			if ( isImage( context.file ) ) {
				return '';
			}
			if (
				context.file.type.startsWith( 'audio/' ) ||
				context.file.name.endsWith( '.mp3' ) ||
				context.file.name.endsWith( '.wav' ) ||
				context.file.name.endsWith( '.m4a' )
			) {
				return '';
			}
			if (
				context.file.type.startsWith( 'video/' ) ||
				context.file.name.endsWith( '.mp4' ) ||
				context.file.name.endsWith( '.mov' ) ||
				context.file.name.endsWith( '.avi' ) ||
				context.file.name.endsWith( '.wmv' ) ||
				context.file.name.endsWith( '.flv' ) ||
				context.file.name.endsWith( '.mpeg' ) ||
				context.file.name.endsWith( '.mpg' )
			) {
				return '';
			}
			if (
				[ 'application/pdf' ].includes( context.file.type ) ||
				context.file.name.endsWith( '.pdf' )
			) {
				return '';
			}
			if (
				[
					'application/msword',
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				].includes( context.file.type ) ||
				context.file.name.endsWith( '.docx' ) ||
				context.file.name.endsWith( '.doc' ) ||
				context.file.name.endsWith( '.docm' )
			) {
				return '';
			}
			if (
				context.file.type.startsWith(
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
				) ||
				context.file.name.endsWith( '.xls' ) ||
				context.file.name.endsWith( '.xlsx' ) ||
				context.file.name.endsWith( '.csv' )
			) {
				return '';
			}
			if (
				context.file.name.endsWith( '.zip' ) ||
				context.file.name.endsWith( '.rar' ) ||
				context.file.name.endsWith( '.tar' ) ||
				context.file.name.endsWith( '.gz' ) ||
				context.file.name.endsWith( '.bz2' )
			) {
				return '';
			}
			if (
				context.file.name.endsWith( '.txt' ) ||
				context.file.name.endsWith( '.rtf' )
			) {
				return '';
			}
			if (
				context.file.name.endsWith( '.ppt' ) ||
				context.file.name.endsWith( '.pptx' )
			) {
				return '';
			}
			return '';
		},
	},
	actions: {
		displayPreview: () => {
			const context = getContext< FileContext >();
			if (
				context.file.type.startsWith( 'image/' ) &&
				context.file.status.success
			) {
				actions.displayPreviewImage();
			} else {
				actions.displayFileTypeIcon();
			}
		},
		displayFileTypeIcon: async () => {
			const element = getElement().ref as HTMLSpanElement;
			const context = getContext< FileContext >();

			element.classList.add(
				'dashicons',
				`dashicons-${ fileTypeDashicon( context.file ) }`
			);
		},
		displayPreviewImage: async () => {
			const element = getElement().ref as HTMLSpanElement;
			const context = getContext< FileContext >();
			const img = document.createElement( 'img' );
			img.src = ( state as VfsState )
				.configuration!.fileURLForMethod(
					context.file.remotePath,
					'GET'
				)
				.toString();
			img.alt = context.file.type;
			element.appendChild( img );
		},
	},
} ) as {
	actions: any;
	state: any;
};
