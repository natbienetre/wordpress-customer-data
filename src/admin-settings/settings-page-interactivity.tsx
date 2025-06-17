/**
 * VFS Upload Handler
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description Handles file uploads to Swift storage.
 */

import { store, getElement } from '@wordpress/interactivity';

type VfsAdminSettingsFeature = 'staticSignature' | 'keyManagement';

type VfsAdminSettingsState = {
	features: Record< VfsAdminSettingsFeature, boolean >;
};

const { state } = store( 'vfs-admin-settings', {
	state: {
		features: {
			staticSignature: false,
			keyManagement: true,
		},
	} as VfsAdminSettingsState,
	callbacks: {
		propagateFeatureChange() {
			const element = getElement().ref as HTMLInputElement & {
				dataset: {
					vfsAdminSettingsFeatureTarget: string;
				};
			};

			const key = element.dataset
				.vfsAdminSettingsFeatureTarget as VfsAdminSettingsFeature;

			state.features[ key ] = element.checked;

			switchFeature( document, key );
		},
		resetFeature() {
			const form = getElement().ref as HTMLFormElement;

			state.features = form
				.querySelectorAll( 'input' )
				.values()
				// Element with a dataset.vfsAdminSettingsFeatureTarget
				.filter(
					( element ) => element.dataset.vfsAdminSettingsFeatureTarget
				)
				// Map to [featureName, isEnabled]
				.map( ( element ) => [
					element.dataset
						.vfsAdminSettingsFeatureTarget! as VfsAdminSettingsFeature,
					element.checked,
				] )
				// Reduce to a record of featureName -> isEnabled
				.reduce(
					( acc, [ key, checked ] ) => {
						acc[ key as VfsAdminSettingsFeature ] =
							checked as boolean;
						return acc;
					},
					state.features as Record< VfsAdminSettingsFeature, boolean >
				);

			// Switch features based on the state
			for ( const key in state.features ) {
				switchFeature( document, key as VfsAdminSettingsFeature );
			}

			const inputs = getInputs( form );
			resetFields( inputs );
		},
		bindFeatures() {
			for ( const key in state.features ) {
				switchFeature( document, key as VfsAdminSettingsFeature );
			}
		},
		loadOpenrc() {
			const element = getElement().ref as HTMLInputElement;
			const inputs = getInputs( element );

			resetFields( inputs );
			for ( const file of element.files || [] ) {
				loadCb( inputs, file );
			}
		},
	},
} );

const getInputs = ( container: ParentNode ) => {
	const authUrlInput = container.querySelector(
		'#vfs-swift-auth-url'
	) as HTMLInputElement;

	const identityApiVersionInput = container.querySelector(
		'vfs-swift-identity-api-version'
	) as HTMLInputElement;

	const openstackUserDomainNameInput = container.querySelector(
		'vfs-swift-user-domain-name'
	) as HTMLInputElement;

	const openstackTenantIdInput = container.querySelector(
		'vfs-swift-tenant-id'
	) as HTMLInputElement;

	const openstackTenantNameInput = container.querySelector(
		'vfs-swift-tenant-name'
	) as HTMLInputElement;

	const openstackPasswordInput = container.querySelector(
		'vfs-swift-password'
	) as HTMLInputElement;

	const openstackUsernameInput = container.querySelector(
		'vfs-swift-user'
	) as HTMLInputElement;

	const openstackRegionNameInput = container.querySelector(
		'vfs-swift-region'
	) as HTMLInputElement;

	return {
		authUrlInput,
		identityApiVersionInput,
		openstackUserDomainNameInput,
		openstackTenantIdInput,
		openstackTenantNameInput,
		openstackPasswordInput,
		openstackUsernameInput,
		openstackRegionNameInput,
	} as SwiftInputs;
};

const selectorPrefix = '.vfs-admin-settings-';
const selectorEnabledSuffix = '-enabled';
const selectorDisabledSuffix = '-disabled';

const selectors = {
	staticSignature: `static-signature`,
	keyManagement: `key-management`,
} as Record< VfsAdminSettingsFeature, string >;

const switchFeature = async (
	container: ParentNode,
	key: VfsAdminSettingsFeature
) => {
	const selector = selectors[ key ];

	container
		.querySelectorAll(
			`${ selectorPrefix }${ selector }${ selectorEnabledSuffix }`
		)
		.forEach( ( element ) => {
			if ( state.features[ key ] ) {
				element.classList.remove( 'vfs-hidden' );
			} else {
				element.classList.add( 'vfs-hidden' );
			}
		} );

	container
		.querySelectorAll(
			`${ selectorPrefix }${ selector }${ selectorDisabledSuffix }`
		)
		.forEach( ( element ) => {
			if ( state.features[ key ] ) {
				element.classList.add( 'vfs-hidden' );
			} else {
				element.classList.remove( 'vfs-hidden' );
			}
		} );
};

type SwiftInputs = {
	authUrlInput: HTMLInputElement;
	identityApiVersionInput: HTMLInputElement;
	openstackUserDomainNameInput: HTMLInputElement;
	openstackTenantIdInput: HTMLInputElement;
	openstackTenantNameInput: HTMLInputElement;
	openstackPasswordInput: HTMLInputElement;
	openstackUsernameInput: HTMLInputElement;
	openstackRegionNameInput: HTMLInputElement;
};

const container = ( input: HTMLInputElement ) =>
	input.parentElement?.parentElement;

const resetFields = ( inputs: SwiftInputs ) => {
	container( inputs.authUrlInput )?.classList.remove( 'updated' );
	container( inputs.identityApiVersionInput )?.classList.remove( 'updated' );
	container( inputs.openstackUserDomainNameInput )?.classList.remove(
		'updated'
	);
	container( inputs.openstackTenantIdInput )?.classList.remove( 'updated' );
	container( inputs.openstackTenantNameInput )?.classList.remove( 'updated' );
	container( inputs.openstackPasswordInput )?.classList.remove( 'updated' );
	container( inputs.openstackUsernameInput )?.classList.remove( 'updated' );
	container( inputs.openstackRegionNameInput )?.classList.remove( 'updated' );
};

const keyToInput = {
	OS_AUTH_URL: ( inputs: SwiftInputs ) => inputs.authUrlInput,
	OS_IDENTITY_API_VERSION: ( inputs: SwiftInputs ) =>
		inputs.identityApiVersionInput,
	OS_USER_DOMAIN_NAME: ( inputs: SwiftInputs ) =>
		inputs.openstackUserDomainNameInput,
	OS_TENANT_ID: ( inputs: SwiftInputs ) => inputs.openstackTenantIdInput,
	OS_TENANT_NAME: ( inputs: SwiftInputs ) => inputs.openstackTenantNameInput,
	OS_PASSWORD: ( inputs: SwiftInputs ) => inputs.openstackPasswordInput,
	OS_USERNAME: ( inputs: SwiftInputs ) => inputs.openstackUsernameInput,
	OS_REGION_NAME: ( inputs: SwiftInputs ) => inputs.openstackRegionNameInput,
	OS_PROJECT_DOMAIN_NAME: () => null,
} as Record< string, ( inputs: SwiftInputs ) => HTMLInputElement | null >;

const setOption = (
	inputs: SwiftInputs,
	key: string,
	value: string
): boolean => {
	if ( ! ( key in keyToInput ) ) {
		return false;
	}

	const input = keyToInput[ key ]( inputs );
	if ( null === input ) {
		return false;
	}

	if ( input.value === value ) {
		return false;
	}

	input.value = value;
	container( input )?.classList.add( 'updated' );

	return true;
};

const loadCb = ( inputs: SwiftInputs, file: File ) => {
	file.text().then( ( text ) => {
		text.split( '\n' )
			.map( ( line ) => {
				if ( ! line.startsWith( 'export OS_' ) ) {
					return false;
				}

				const [ key, value ] = line.split( '=' );

				return [
					key.substring( 'export '.length ),
					sanitizeValue( value ),
				];
			} )
			.filter( ( line ) => false !== line )
			.forEach( ( [ key, value ] ) => setOption( inputs, key, value ) );
	} );
};

const sanitizeValue = ( value: string ): string => {
	const newValue = value
		.replace( /^'([^']*)'$/, '$1' )
		.replace( /^"(.*)"$/, '$1' )
		.replace( /^\$\{.*:-(.*)\}$/, '$1' );

	if ( newValue !== value ) {
		return sanitizeValue( newValue );
	}

	return newValue;
};
