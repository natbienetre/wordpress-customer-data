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
import { PluginSidebar, store as editorStore } from '@wordpress/editor';
import {
	Button,
	Modal,
	PanelBody,
	PanelRow,
	ToggleControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { people, plus, settings, file, bug } from '@wordpress/icons';
import { SwiftAdmin, CustomerDataAdminConfiguration } from '../file-management';
import wordpressUrl from '../wordpress/url';
import apiFetch from '../wordpress/api-fetch';
import type {
	TemporaryPrefixedUrlQueryParams,
	TemporaryUrlQueryParams,
} from '../configuration';
import { usePageSpace } from '../post';
import { UsersList } from './UsersList';
import { UploadDestinationSelector } from './UploadDestinationSelector';
import { CustomerDataBlockSelector } from './CustomerDataBlockSelector';

import './EditorSidebar.scss';
import {
	useDispatchVisibilityHelperPreference,
	useSelectVisibilityHelperPreference,
} from '../visibility-helper-preference';
import { URLGenerationForm } from './URLGenerationForm';

export const EditorSidebar: React.FC = () => {
	const duration = 1000 * 60 * 30; // 30 minutes
	const [ expiresAt, setExpiresAt ] = useState< Date >(
		new Date( Date.now() + duration )
	);
	const [ queryParams, setQueryParams ] = useState<
		( TemporaryPrefixedUrlQueryParams | TemporaryUrlQueryParams ) | null
	>( null );

	useEffect( () => {
		const timeout = setTimeout(
			() => {
				setExpiresAt( new Date( Date.now() + duration ) );
			},
			new Date( expiresAt ).getTime() - Date.now()
		);

		return () => clearTimeout( timeout );
	}, [ expiresAt, duration ] );

	const [ isGenerateUrlOpen, setIsGenerateUrlOpen ] =
		useState< boolean >( false );
	const pageSpace = usePageSpace();

	const permalink = useSelect( ( select ) => {
		return select( editorStore ).getPermalink() || '';
	}, [] );

	const customerDataAdminConfig = useMemo(
		() => ( {
			...window.customerDataAdminConfig!,
			options: {
				...window.customerDataAdminConfig!.options,
				pageSpace,
			},
		} ),
		[ pageSpace ]
	);

	const swiftAdmin = useMemo(
		() =>
			new SwiftAdmin(
				new CustomerDataAdminConfiguration( customerDataAdminConfig, wordpressUrl ),
				wordpressUrl,
				apiFetch
			),
		[ customerDataAdminConfig ]
	);

	useEffect( () => {
		let cancelled = false;

		if ( null !== queryParams ) {
			return;
		}

		swiftAdmin
			.queryParams( 'GET', expiresAt, pageSpace )
			.then( ( newQueryParams ) => {
				if ( cancelled ) {
					return;
				}

				setQueryParams( newQueryParams );
			} );

		return () => {
			cancelled = true;
		};
	}, [ swiftAdmin, pageSpace, expiresAt, queryParams ] );

	const visibilityHelperPreference = useSelectVisibilityHelperPreference();
	const dispatchVisibilityHelperPreference =
		useDispatchVisibilityHelperPreference();

	return (
		<>
			<PluginSidebar
				name="customer-data-users-spaces"
				title={ __( 'Users spaces', 'customer-data' ) }
				icon={ people }
			>
				<PanelBody
					initialOpen={ false }
					title={ __( 'Accessibility', 'customer-data' ) }
					icon={ bug }
				>
					<PanelRow>
						<CustomerDataBlockSelector />
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={ __( 'Block visibility helper', 'customer-data' ) }
							checked={ visibilityHelperPreference }
							onChange={ ( value ) => {
								dispatchVisibilityHelperPreference( value );
							} }
						/>
					</PanelRow>
				</PanelBody>
				<PanelBody
					initialOpen={ false }
					title={ __( 'Settings', 'customer-data' ) }
					icon={ settings }
				>
					<PanelRow>
						<UploadDestinationSelector />
					</PanelRow>
				</PanelBody>
				<PanelBody
					title={ __( 'Files', 'customer-data' ) }
					icon={ file }
					className="customer-data-editor-sidebar-files"
				>
					<PanelRow>
						<Button
							__next40pxDefaultSize
							onClick={ () => setIsGenerateUrlOpen( true ) }
							isBusy={ isGenerateUrlOpen }
							icon={ plus }
							text={ __( 'Create a new space', 'customer-data' ) }
						/>
						{ isGenerateUrlOpen && (
							<Modal
								icon={ people }
								title={ __( 'Temporary URL', 'customer-data' ) }
								onRequestClose={ () =>
									setIsGenerateUrlOpen( false )
								}
							>
								<URLGenerationForm
									swiftAdmin={ swiftAdmin }
									landingPage={ permalink }
								/>
							</Modal>
						) }
					</PanelRow>
					<UsersList
						swiftAdmin={ swiftAdmin }
						pageSpace={ pageSpace }
						queryParams={ queryParams }
					/>
				</PanelBody>
			</PluginSidebar>
		</>
	);
};

export default EditorSidebar;
