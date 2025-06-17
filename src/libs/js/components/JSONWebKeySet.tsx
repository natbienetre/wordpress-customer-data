import {
	Button,
	Modal,
	Panel,
	PanelBody,
	PanelRow,
} from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	SwiftAdmin,
	type VfsAdminConfig,
	VfsAdminConfiguration,
} from '../file-management';
import { people, plus, tool, unlock } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import wordpressUrl from '../wordpress/url';
import { TokenInspection } from './TokenValidation';
import { TokenGenerationForm } from './TokenGenerationForm';

export const JSONWebKeySet: React.FC< {
	vfsAdminConfig: VfsAdminConfig;
} > = ( { vfsAdminConfig: initialVfsAdminConfig } ): JSX.Element => {
	const [ isGenerateUrlOpen, setIsGenerateUrlOpen ] = useState( false );

	const swiftAdmin = useMemo(
		() =>
			new SwiftAdmin(
				new VfsAdminConfiguration(
					{
						...initialVfsAdminConfig!,
						options: {
							...initialVfsAdminConfig!.options,
							pageSpace: '', // Generate global tokens only
						},
					},
					wordpressUrl
				),
				wordpressUrl,
				apiFetch
			),
		[ initialVfsAdminConfig ]
	);

	/*
	if ( swiftAdmin.adminConfiguration.keyManagement.jwksUrl ) {
		try
			return createRemoteJWKSet(
				new URL(
					swiftAdmin.adminConfiguration.keyManagement.jwksUrl
				)
			);
			...
	*/

	return (
		( window.vfsAdminConfig?.keyManagement?.enabled && (
			<Panel header={ __( 'JSON Web Key Set', 'vfs' ) }>
				<PanelBody
					title={ __( 'Token validation', 'vfs' ) }
					icon={ unlock }
				>
					<PanelRow>
						<TokenInspection />
					</PanelRow>
				</PanelBody>
				<PanelBody title={ __( 'User space', 'vfs' ) } icon={ tool }>
					<PanelRow>
						<Button
							__next40pxDefaultSize
							onClick={ () => setIsGenerateUrlOpen( true ) }
							isBusy={ isGenerateUrlOpen }
							icon={ plus }
							text={ __( 'Create a new space', 'vfs' ) }
						/>
						{ isGenerateUrlOpen && (
							<Modal
								icon={ people }
								title={ __( 'Temporary token', 'vfs' ) }
								onRequestClose={ () =>
									setIsGenerateUrlOpen( false )
								}
							>
								<TokenGenerationForm
									swiftAdmin={ swiftAdmin }
								/>
							</Modal>
						) }
					</PanelRow>
				</PanelBody>
			</Panel>
		) ) || <></>
	);
};
