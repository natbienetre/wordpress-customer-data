/**
 * This component populate HTML input elements with values from an openrc file.
 *
 * @see https://docs.openstack.org/newton/user-guide/common/cli-set-environment-variables-using-openstack-rc.html
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { FormFileUpload, Notice, DropZone } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import warning from '@wordpress/warning';
import { upload } from '@wordpress/icons';

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

export const LoadOpenrc: React.FC< {
	authUrlInput: HTMLInputElement;
	identityApiVersionInput: HTMLInputElement;
	openstackUsernameInput: HTMLInputElement;
	openstackUserDomainNameInput: HTMLInputElement;
	openstackTenantIdInput: HTMLInputElement;
	openstackTenantNameInput: HTMLInputElement;
	openstackPasswordInput: HTMLInputElement;
	openstackRegionNameInput: HTMLInputElement;
} > = ( {
	authUrlInput,
	identityApiVersionInput,
	openstackUsernameInput,
	openstackUserDomainNameInput,
	openstackTenantIdInput,
	openstackTenantNameInput,
	openstackPasswordInput,
	openstackRegionNameInput,
} ): JSX.Element => {
	const [ openrcFile, setOpenrcFile ] = useState< File | undefined >(
		undefined
	);
	const [ isLoading, setIsLoading ] = useState< boolean >( false );
	const [ updatedFields, setUpdatedFields ] = useState<
		Record< string, boolean >
	>( {} );

	const resetFields = useCallback( () => {
		setUpdatedFields( {} );
		authUrlInput.parentElement?.classList.remove( 'updated' );
		identityApiVersionInput.parentElement?.classList.remove( 'updated' );
		openstackUserDomainNameInput.parentElement?.classList.remove(
			'updated'
		);
		openstackTenantIdInput.parentElement?.classList.remove( 'updated' );
		openstackTenantNameInput.parentElement?.classList.remove( 'updated' );
		openstackPasswordInput.parentElement?.classList.remove( 'updated' );
		openstackUsernameInput.parentElement?.classList.remove( 'updated' );
		openstackRegionNameInput.parentElement?.classList.remove( 'updated' );
	}, [
		authUrlInput,
		identityApiVersionInput,
		openstackUserDomainNameInput,
		openstackTenantIdInput,
		openstackTenantNameInput,
		openstackPasswordInput,
		openstackUsernameInput,
		openstackRegionNameInput,
	] );

	const keyToInput = useMemo(
		() =>
			( {
				OS_AUTH_URL: authUrlInput,
				OS_IDENTITY_API_VERSION: identityApiVersionInput,
				OS_USER_DOMAIN_NAME: openstackUserDomainNameInput,
				OS_TENANT_ID: openstackTenantIdInput,
				OS_TENANT_NAME: openstackTenantNameInput,
				OS_PASSWORD: openstackPasswordInput,
				OS_USERNAME: openstackUsernameInput,
				OS_REGION_NAME: openstackRegionNameInput,
				OS_PROJECT_DOMAIN_NAME: null,
			} ) as Record< string, HTMLInputElement | null >,
		[
			authUrlInput,
			identityApiVersionInput,
			openstackUserDomainNameInput,
			openstackTenantIdInput,
			openstackTenantNameInput,
			openstackPasswordInput,
			openstackUsernameInput,
			openstackRegionNameInput,
		]
	);

	const setOption = useCallback(
		( key: string, value: string ): boolean => {
			if ( ! ( key in keyToInput ) ) {
				warning( `Unknown option: ${ key }` );
				return false;
			}

			const input = keyToInput[ key ];
			if ( null === input ) {
				return false;
			}

			if ( input.value === value ) {
				return false;
			}

			input.value = value;
			input.parentElement?.classList.add( 'updated' );
			setUpdatedFields( {
				...updatedFields,
				[ key ]: true,
			} );
			return true;
		},
		[ updatedFields, keyToInput ]
	);

	const loadCb = useCallback(
		( file: File ) => {
			setIsLoading( true );
			setOpenrcFile( file );

			file.text()
				.then( ( text ) => {
					resetFields();

					setUpdatedFields(
						text
							.split( '\n' )
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
							.map( ( [ key, value ] ) => [
								key,
								setOption( key, value ),
							] )
							.reduce(
								( acc, [ key, value ] ) => {
									acc[ key.toString() ] = Boolean( value );
									return acc;
								},
								{} as Record< string, boolean >
							)
					);
				} )
				.finally( () => setIsLoading( false ) );
		},
		[ resetFields, setOption ]
	);

	return (
		<>
			{ Object.keys( updatedFields ).length > 0 && (
				<Notice
					className="customer-data-swift-provider-openrc-loader-notice"
					status={
						Object.values( updatedFields ).filter( Boolean )
							.length > 0
							? 'success'
							: 'info'
					}
					isDismissible={ true }
					onRemove={ resetFields }
					onDismiss={ () => setUpdatedFields( {} ) }
				>
					{ sprintf(
						// translators: %d is the number of fields loaded from the openrc file.
						_n(
							'Loaded %d field from openrc file',
							'Loaded %d fields from openrc file',
							Object.keys( updatedFields ).length,
							'customer-data'
						),
						Object.keys( updatedFields ).length
					) }
				</Notice>
			) }
			<DropZone
				isEligible={ ( input ) => {
					if ( 1 !== input.files.length ) {
						return false;
					}

					const file = input.files[ 0 ];

					if ( 'text/x-shellscript' === file.type ) {
						return true;
					}

					warning(
						`File ${ file.name } (${ file.type }) is not a valid openrc file`
					);

					return false;
				} }
				onHTMLDrop={ () => {
					throw new Error( 'Not supported' );
				} }
				onFilesDrop={ ( files ) => {
					if ( 1 !== files.length ) {
						throw new Error( 'Not supported' );
					}

					loadCb( files[ 0 ] );
				} }
				label={ __( 'Drop openrc file here', 'customer-data' ) }
			/>
			<FormFileUpload
				className="customer-data-swift-provider-openrc-loader-form-file-upload"
				__next40pxDefaultSize
				accept=".sh"
				disabled={ isLoading }
				multiple={ false }
				onChange={ ( input: React.ChangeEvent< HTMLInputElement > ) => {
					if ( 0 === input.target.files?.length ) {
						setOpenrcFile( undefined );
						return;
					}

					input.currentTarget.blur();
					loadCb( input.target.files![ 0 ] );
				} }
				icon={ upload }
			>
				{ openrcFile
					? openrcFile.name
					: __( 'Select openrc file', 'customer-data' ) }
			</FormFileUpload>
		</>
	);
};
