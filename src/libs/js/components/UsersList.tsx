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
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import { external } from '@wordpress/icons';
import { SwiftAdmin } from '../file-management';
import type {
	TemporaryPrefixedUrlQueryParams,
	TemporaryUrlQueryParams,
} from '../configuration';

import './EditorSidebar.scss';
import { FilesList } from './FilesList';

export const UsersList: React.FC< {
	swiftAdmin: SwiftAdmin;
	pageSpace: string;
	queryParams:
		| TemporaryPrefixedUrlQueryParams
		| TemporaryUrlQueryParams
		| null;
} > = ( { swiftAdmin, pageSpace, queryParams } ) => {
	// TODO: use a global custom thunks instead. See https://developer.wordpress.org/block-editor/how-to-guides/thunks/
	const [ users, setUsers ] = useState< { id: string }[] >( [] );
	const [ isCompleted, setIsCompleted ] = useState< boolean >( false );

	const load = useCallback(
		async ( isCancelled: () => boolean ) => {
			for await ( const user of swiftAdmin.users() ) {
				if ( isCancelled() ) {
					return;
				}

				if ( users.some( ( u ) => u.id === user ) ) {
					continue;
				}

				setUsers( [
					...users,
					{
						id: user,
					},
				] );
			}

			setIsCompleted( true );
		},
		[ swiftAdmin, users, setIsCompleted ]
	);

	useEffect( () => {
		let cancelled = false;

		load( () => cancelled );

		return () => {
			cancelled = true;
		};
	}, [ load ] );

	const fields = useMemo(
		() =>
			[
				{
					id: 'id',
					label: __( 'ID', 'customer-data' ),
					type: 'text',
					enableSorting: true,
					enableHiding: true,
					enableGlobalSearch: true,
					header: __( 'User', 'customer-data' ),
				},
			] as Field< {
				id: string;
			} >[],
		[]
	);
	const [ view, setView ] = useState< View >( {
		type: 'list',
		fields: [],
		titleField: 'id',
		showTitle: true,
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( users, view, fields );
	}, [ view, fields, users ] );

	return (
		<DataViews
			getItemId={ ( user: { id: string } ) => user.id }
			paginationInfo={ paginationInfo }
			data={ shownData }
			isLoading={ ! isCompleted }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			defaultLayouts={ {
				table: {},
			} }
			actions={ [
				{
					id: 'browse',
					label: __( 'Browse', 'customer-data' ),
					icon: external,
					//callback: ( items ) => {
					//	setUserSelected( items[ 0 ].id );
					//},
					disabled: null === queryParams,
					supportsBulk: false,
					isPrimary: true,
					RenderModal: ( { items }: { items: { id: string }[] } ) => (
						<FilesList
							swiftAdmin={ swiftAdmin }
							userId={ items[ 0 ].id }
							pageSpace={ pageSpace }
							queryParams={ queryParams! }
						/>
					),
					modalHeader: __( 'User files', 'customer-data' ),
					modalSize: 'fill',
					hideModalHeader: true,
				},
			] }
		/>
	);
};
