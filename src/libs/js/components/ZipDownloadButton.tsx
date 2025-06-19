/**
 * Editor Sidebar Component
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This component provides a UI for generating temporary URLs in the WordPress editor sidebar.
 */

import type React from 'react';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Button, ProgressBar } from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { download } from '@wordpress/icons';
import warning from '@wordpress/warning';
import { ZipError } from '../file-upload';
import { SwiftAdmin } from '../file-management';
import JSZip from 'jszip';
import type { VisitorUploadedFile } from 'global';

import './EditorSidebar.scss';
import { getErrorMessage } from '../utils';
import i18n from '../wordpress/i18n';

export const ZipDownloadButton: React.FC< {
	swiftAdmin: SwiftAdmin;
	basename: string;
	files: VisitorUploadedFile[];
} > = ( { swiftAdmin, files, basename } ) => {
	const [ zippedFilesCount, setZippedFilesCount ] = useState<
		number | undefined
	>( undefined );
	const fileCount = useMemo( () => Object.keys( files ).length, [ files ] );

	return (
		( zippedFilesCount === undefined && (
			<Button
				__next40pxDefaultSize
				onClick={ () => {
					if ( zippedFilesCount === undefined ) {
						setZippedFilesCount( 0 );
					} else {
						return;
					}

					const zipFile = new JSZip();

					// todo use useCallback
					swiftAdmin
						.zip(
							zipFile.folder( basename ) || zipFile,
							( count ) => setZippedFilesCount( count ),
							...files.map( ( f ) => f.remotePath )
						)
						.catch( ( err: Error ) => {
							if ( err instanceof ZipError ) {
								for ( const [
									filepath,
									error,
								] of Object.entries( err.errors ) ) {
									zipFile.file(
										filepath + '__ERROR__.txt',
										error.message
									);
								}
							} else {
								warning(
									sprintf(
										// translators: %s is the error message
										__( 'Failed to zip files: %s', 'customer-data' ),
										getErrorMessage( i18n, err )
									)
								);
							}
						} )
						.then( () =>
							zipFile.generateAsync( {
								type: 'blob',
							} )
						)
						.then( ( blob ) => {
							const url = URL.createObjectURL( blob );
							try {
								window.open( url, '_blank' );
							} catch ( err: unknown ) {
								warning( getErrorMessage( i18n, err ) );
							} finally {
								setTimeout( () => {
									URL.revokeObjectURL( url );
								}, 1000 );
							}
						} )
						.finally( () => setZippedFilesCount( undefined ) );
				} }
				download={ basename + '.zip' }
				icon={ download }
				text={ fileCount.toString() }
				description={ sprintf(
					// translators: %d is the number of files
					_n(
						'Download %d file',
						'Download %d files',
						fileCount,
						'customer-data'
					),
					fileCount
				) }
				label={ __( 'Download', 'customer-data' ) }
			/>
		) ) || <ProgressBar value={ zippedFilesCount || 0 } max={ fileCount } />
	);
};
