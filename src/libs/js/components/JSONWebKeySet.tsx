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
	type CustomerDataAdminConfig,
	CustomerDataAdminConfiguration,
} from '../file-management';
import { people, plus, tool, unlock } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import wordpressUrl from '../wordpress/url';
import { TokenInspection } from './TokenValidation';
import { TokenGenerationForm } from './TokenGenerationForm';

export const JSONWebKeySet: React.FC< {
	customerDataAdminConfig: CustomerDataAdminConfig;
} > = ( { customerDataAdminConfig: initialCustomerDataAdminConfig } ): JSX.Element => {
	const [ isGenerateUrlOpen, setIsGenerateUrlOpen ] = useState( false );

	const swiftAdmin = useMemo(
		() =>
			new SwiftAdmin(
				new CustomerDataAdminConfiguration(
					{
						...initialCustomerDataAdminConfig!,
						options: {
							...initialCustomerDataAdminConfig!.options,
							pageSpace: '', // Generate global tokens only
						},
					},
					wordpressUrl
				),
				wordpressUrl,
				apiFetch
			),
		[ initialCustomerDataAdminConfig ]
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
		( window.customerDataAdminConfig?.keyManagement?.enabled && (
			<Panel header={ __( 'JSON Web Key Set', 'customer-data' ) }>
				<PanelBody
					title={ __( 'Token validation', 'customer-data' ) }
					icon={ unlock }
				>
					<PanelRow>
						<TokenInspection />
					</PanelRow>
				</PanelBody>
				<PanelBody title={ __( 'User space', 'customer-data' ) } icon={ tool }>
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
								title={ __( 'Temporary token', 'customer-data' ) }
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
