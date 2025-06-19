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
import { __ } from '@wordpress/i18n';
import {
	DataViews,
	type Field,
	filterSortAndPaginate,
	type View,
} from '@wordpress/dataviews/wp'; // https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#dataviews
import { Button, Icon, Modal } from '@wordpress/components';
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import {
	trash,
	notFound,
	customLink,
	cloudDownload,
	people,
} from '@wordpress/icons';
import warning from '@wordpress/warning';
import JSZip from 'jszip';
import type { VisitorUploadedFile } from 'global';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { FileName } from './FileName';
import { FileCreationDate } from './FileCreationDate';
import { FileType } from './FileType';
import { ZipDownloadButton } from './ZipDownloadButton';
import { getErrorMessage } from '../utils';
import i18n from '../wordpress/i18n';
import type {
	TemporaryPrefixedUrlQueryParams,
	TemporaryUrlQueryParams,
} from '../configuration';
import { ZipError } from '../file-upload';
import { SwiftAdmin } from '../file-management';
import { formatFileSize } from '../format';
import { pathDelimiter, pathJoin } from '../swift';

import './EditorSidebar.scss';
import { URLGenerationForm } from './URLGenerationForm';

export const FilesList: React.FC< {
	swiftAdmin: SwiftAdmin;
	userId: string;
	pageSpace: string;
	queryParams: TemporaryPrefixedUrlQueryParams | TemporaryUrlQueryParams;
} > = ( { swiftAdmin, userId, pageSpace, queryParams } ) => {
	const [ isCompleted, setIsCompleted ] = useState< boolean >( false );
	const [ files, setFiles ] = useState< {
		[ remotePath: string ]: VisitorUploadedFile & {
			downloadUrl: URL | null;
			deleted: boolean;
		};
	} >( {} );

	const permalink = useSelect( ( select ) => {
		return select( editorStore ).getPermalink() || '';
	}, [] );

	useEffect( () => {
		if ( isCompleted ) {
			return;
		}

		let active = true;

		load();

		return () => {
			active = false;
		};

		async function load() {
			const basename = pathJoin(
				swiftAdmin.adminConfiguration.sitePrefix(),
				userId,
				pageSpace
			);

			for await ( const item of swiftAdmin.deepList( basename ) ) {
				if ( ! active ) {
					return;
				}

				if ( item.remotePath in files ) {
					continue;
				}

				setFiles( {
					...files,
					[ item.remotePath ]: {
						...item,
						downloadUrl:
							swiftAdmin.adminConfiguration.fileURLWithParams(
								item.remotePath,
								queryParams
							),
						deleted: false,
					},
				} );
			}

			setIsCompleted( true );
		}
	}, [ files, swiftAdmin, userId, pageSpace, queryParams, isCompleted ] );

	const filesList = useMemo( () => Object.values( files ), [ files ] );

	const basename = useMemo(
		() =>
			pathJoin(
				userId,
				swiftAdmin.adminConfiguration.customerDataAdminConfig.options.pageSpace
			),
		[ swiftAdmin, userId ]
	);
	const [ deletedFiles, setDeletedFiles ] = useState< string[] >( [] );

	const fields = useMemo(
		() =>
			[
				{
					id: 'icon',
					label: __( 'Icon', 'customer-data' ),
					type: 'media',
					enableSorting: true,
					enableHiding: true,
					render: ( {
						item,
					}: {
						item: VisitorUploadedFile & {
							downloadUrl: URL | null;
							deleted: boolean;
						};
					} ) => {
						return item.deleted ? (
							<Icon icon={ notFound } />
						) : (
							<FileType visitorFile={ item } />
						);
					},
				},
				{
					id: 'name',
					label: __( 'Name', 'customer-data' ),
					type: 'text',
					enableSorting: true,
					enableHiding: true,
					enableGlobalSearch: true,
					render: ( {
						item,
					}: {
						item: VisitorUploadedFile & {
							downloadUrl: URL | null;
							deleted: boolean;
						};
					} ) => {
						return <FileName visitorFile={ item } />;
					},
				},
				{
					id: 'remotePath',
					label: __( 'Remote path', 'customer-data' ),
					type: 'text',
					enableSorting: true,
					enableHiding: true,
					enableGlobalSearch: true,
				},
				{
					id: 'type',
					label: __( 'Type', 'customer-data' ),
					type: 'text',
					enableSorting: false,
					enableHiding: true,
				},
				{
					id: 'size',
					label: __( 'Size', 'customer-data' ),
					type: 'number',
					enableSorting: true,
					enableHiding: true,
					render: ( {
						item,
					}: {
						item: VisitorUploadedFile & {
							downloadUrl: URL | null;
							deleted: boolean;
						};
					} ) => formatFileSize( item.size ),
				},
				{
					id: 'creationDate',
					label: __( 'Date', 'customer-data' ),
					type: 'datetime',
					enableSorting: true,
					enableHiding: true,
					render: ( {
						item,
					}: {
						item: VisitorUploadedFile & {
							downloadUrl: URL | null;
							deleted: boolean;
						};
					} ) => <FileCreationDate visitorFile={ item } />,
				},
			] as Field<
				VisitorUploadedFile & {
					downloadUrl: URL | null;
					deleted: boolean;
				}
			>[],
		[]
	);
	const [ view, setView ] = useState< View >( {
		type: 'table',
		fields: [ 'size', 'creationDate' ],
		titleField: 'name',
		mediaField: 'icon',
		sort: {
			field: 'creationDate',
			direction: 'desc',
		},
		showTitle: true,
		showLevels: false,
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( filesList, view, fields );
	}, [ view, fields, filesList ] );

	const [ isGenerateUrlOpen, setIsGenerateUrlOpen ] =
		useState< boolean >( false );

	const downloadCallback = useCallback(
		( items: { downloadUrl: URL | null }[] ) => {
			switch ( items.length ) {
				case 0:
					return;
				case 1:
					window.open( items[ 0 ].downloadUrl?.toString(), '_blank' );
					break;
				default:
					const zipFile = new JSZip();

					swiftAdmin
						.zip(
							zipFile.folder( basename ) || zipFile,
							() => {},
							...filesList.map( ( f ) => f.remotePath )
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
								throw err;
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
						} );
			}
		},
		[ swiftAdmin, basename, filesList ]
	);

	const deleteCallback = useCallback(
		( items: { remotePath: string }[] ) =>
			Promise.all(
				items.map( ( item ) =>
					swiftAdmin
						.delete( item.remotePath )
						.then( () => item.remotePath )
						.catch( ( err: Error ) => {
							warning( getErrorMessage( i18n, err ) );
							return null;
						} )
				)
			)
				.then( ( results ) =>
					results.filter( ( result ) => null !== result )
				)
				.then( ( results ) =>
					setDeletedFiles(
						results
							.filter(
								( result ) => ! deletedFiles.includes( result )
							)
							.reduce(
								( acc, result ) => [ ...acc, result ],
								deletedFiles
							)
					)
				),
		[ swiftAdmin, deletedFiles ]
	);

	return (
		<div className="customer-data-user-files">
			{ isGenerateUrlOpen && (
				<Modal
					icon={ people }
					title={ __( 'Temporary URL', 'customer-data' ) }
					onRequestClose={ () => setIsGenerateUrlOpen( false ) }
				>
					<URLGenerationForm
						swiftAdmin={ swiftAdmin }
						userDefaults={ {
							id: userId,
						} }
						landingPage={ permalink }
					/>
				</Modal>
			) }
			<DataViews
				getItemId={ ( item: { remotePath: string } ) =>
					item.remotePath.toString()
				}
				paginationInfo={ paginationInfo }
				data={ shownData }
				isLoading={ ! isCompleted }
				getItemLevel={ ( item: { remotePath: string } ) =>
					item.remotePath.split( pathDelimiter ).length - 2
				} // -2 because the first level is the user name
				view={ view }
				header={
					<>
						<ZipDownloadButton
							swiftAdmin={ swiftAdmin }
							basename={ basename }
							files={ filesList }
						/>
						<Button
							__next40pxDefaultSize
							onClick={ () => setIsGenerateUrlOpen( true ) }
							isBusy={ isGenerateUrlOpen }
							icon={ customLink }
							label={ __( 'Generate temporary URL', 'customer-data' ) }
						/>
					</>
				}
				actions={ [
					{
						id: 'download',
						label: __( 'Download', 'customer-data' ),
						icon: cloudDownload,
						supportsBulk: true,
						callback: downloadCallback,
						isPrimary: true,
						isDestructive: false,
						isEligible: ( item ) => ! item.deleted,
					},
					{
						id: 'delete',
						label: __( 'Delete', 'customer-data' ),
						isDestructive: true,
						icon: trash,
						supportsBulk: true,
						callback: deleteCallback,
						isPrimary: true,
						isEligible: ( item: { deleted: boolean } ) =>
							! item.deleted,
					},
				] }
				fields={ fields }
				onChangeView={ setView }
				defaultLayouts={ {
					table: {},
				} }
			/>
		</div>
	);
};
