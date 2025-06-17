import { __, sprintf } from '@wordpress/i18n';
import { Button, Flex, FlexItem, NoticeList } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import warning from '@wordpress/warning';
import {
	OpenStackAdminOptions,
	SwiftAdmin,
	VfsAdminConfiguration,
	VfsAdminOptions,
} from '../file-management';
import {
	HTTPStatusError,
	NetworkError,
	SwiftFile,
	VisitorUploadedFileClass,
} from '../file-upload';
import { OpenStackOptions, VfsConfiguration, VfsOptions } from '../options';
import wordpressUrl from '../wordpress/url';
import apiFetch from '../wordpress/api-fetch';

const getTempUrlExpiration = (): number =>
	Math.floor(
		new Date( new Date().getTime() + 1000 * 60 * 60 ).getTime() / 1000
	); // 1 hour

const getUser = (): string => 'user';

interface NoticeItem {
	id: string;
	status: 'success' | 'error' | 'warning' | 'info';
	isDismissible: boolean;
	content: string;
	actions?: Array< {
		label: string;
		onClick: () => void;
	} >;
}

const getNoticeStatus = (
	result: string | true | undefined
): 'success' | 'error' | 'info' => {
	if ( result === true ) {
		return 'success';
	}
	if ( result === undefined ) {
		return 'info';
	}
	return 'error';
};

const getNoticeContent = (
	result: string | true | undefined,
	type: 'read' | 'write' | 'delete'
): string => {
	if ( result === true ) {
		switch ( type ) {
			case 'read':
				return __( 'Read access granted.', 'vfs' );
			case 'write':
				return __( 'Write access granted.', 'vfs' );
			case 'delete':
				return __( 'Delete access granted.', 'vfs' );
		}
	}
	if ( result === undefined ) {
		switch ( type ) {
			case 'read':
				return __( 'Did not check read access.', 'vfs' );
			case 'write':
				return __( 'Did not check write access.', 'vfs' );
			case 'delete':
				return __( 'Did not check delete access.', 'vfs' );
		}
	}
	switch ( type ) {
		case 'read':
			return sprintf(
				// translators: %s is the error message.
				__( 'An error occurred while checking read access: %s', 'vfs' ),
				result
			);
		case 'write':
			return sprintf(
				// translators: %s is the error message.
				__(
					'An error occurred while checking write access: %s',
					'vfs'
				),
				result
			);
		case 'delete':
			return sprintf(
				// translators: %s is the error message.
				__(
					'An error occurred while checking delete access: %s',
					'vfs'
				),
				result
			);
	}
};

export const CheckOptions: React.FC< {
	authUrlInput: HTMLInputElement;
	swiftBaseURLInput: HTMLInputElement;
	swiftContainerInput: HTMLInputElement;
	openstackUserDomainNameInput: HTMLInputElement;
	openstackTenantIdInput: HTMLInputElement;
	openstackTenantNameInput: HTMLInputElement;
	openstackPasswordInput: HTMLInputElement;
	prefixInput: HTMLInputElement;
	hmacAlgoInput: HTMLInputElement;
	jwkManagementEnabledInput: HTMLInputElement;
	jwksUrlInput: HTMLInputElement;
} > = ( {
	authUrlInput,
	swiftBaseURLInput,
	swiftContainerInput,
	openstackUserDomainNameInput,
	openstackTenantIdInput,
	openstackTenantNameInput,
	openstackPasswordInput,
	prefixInput,
	hmacAlgoInput,
	jwkManagementEnabledInput,
	jwksUrlInput,
} ): JSX.Element => {
	const [ isChecking, setIsChecking ] = useState< boolean >( false );
	const [ readResult, setReadResult ] = useState< string | true | undefined >(
		undefined
	);
	const [ writeResult, setWriteResult ] = useState<
		string | true | undefined
	>( undefined );
	const [ deleteResult, setDeleteResult ] = useState<
		string | true | undefined
	>( undefined );

	const authUrl = authUrlInput.value;
	const swiftBaseURL = swiftBaseURLInput.value;
	const swiftContainer = swiftContainerInput.value;
	const openstackUserDomainName = openstackUserDomainNameInput.value;
	const openstackTenantId = openstackTenantIdInput.value;
	const openstackTenantName = openstackTenantNameInput.value;
	const openstackPassword = openstackPasswordInput.value;
	const prefix = prefixInput.value;
	const hmacAlgo = hmacAlgoInput.value;
	const tempUrlExpiration = getTempUrlExpiration();
	const user = getUser();
	const pageSpace = '';
	const jwkManagementEnabled = jwkManagementEnabledInput.checked;
	const jwksUrl = jwksUrlInput.value;

	const vfsOptions = useMemo(
		() =>
			( {
				accountUrl: swiftBaseURL ?? '',
				container: swiftContainer ?? '',
				additionalPrefix: prefix ?? '',
				pageSpace,
				user,
				vfsToken: '',
				signatureHmacAlgo: hmacAlgo ?? '',
			} ) as VfsOptions,
		[ swiftBaseURL, swiftContainer, prefix, pageSpace, user, hmacAlgo ]
	);

	const osOptions = useMemo(
		() =>
			( {
				swiftBaseUrl: swiftBaseURL ?? '',
				container: swiftContainer ?? '',
				prefix: prefix ?? '',
			} ) as OpenStackOptions,
		[ swiftBaseURL, swiftContainer, prefix ]
	);

	const osAdminOptions = useMemo(
		() =>
			( {
				token: '',
				authUrl: authUrl ?? '',
				userDomainName: openstackUserDomainName ?? '',
				tenantId: openstackTenantId ?? '',
				tenantName: openstackTenantName ?? '',
				user,
				password: openstackPassword ?? '',
			} ) as OpenStackAdminOptions,
		[
			authUrl,
			openstackUserDomainName,
			openstackTenantId,
			openstackTenantName,
			user,
			openstackPassword,
		]
	);

	const vfsAdminOptions = useMemo(
		() =>
			( {
				...vfsOptions,
				...osOptions,
				...osAdminOptions,
			} ) as VfsAdminOptions,
		[ vfsOptions, osOptions, osAdminOptions ]
	);

	const swiftAdmin = useMemo(
		() =>
			new SwiftAdmin(
				new VfsAdminConfiguration(
					{
						options: vfsAdminOptions,
						keyManagement: {
							enabled: jwkManagementEnabled,
							jwksUrl: jwksUrl ?? '',
							mainKey:
								window.vfsAdminConfig?.keyManagement.mainKey ??
								'',
						},
						keys: window.vfsAdminConfig?.keys ?? [],
						allowScopedTokens: false,
					},
					wordpressUrl
				),
				wordpressUrl,
				apiFetch
			),
		[ vfsAdminOptions, jwkManagementEnabled, jwksUrl ]
	);

	const swiftApi = useCallback(
		() =>
			swiftAdmin
				.generateUserToken(
					{
						id: user,
						email: '',
						displayName: '',
					},
					'',
					new Date( tempUrlExpiration * 1000 )
				)
				.then(
					( token ) =>
						new SwiftFile(
							new VfsConfiguration(
								token,
								vfsAdminOptions as OpenStackOptions
							),
							wordpressUrl
						)
				),
		[ swiftAdmin, user, tempUrlExpiration, vfsAdminOptions ]
	);

	const resetResults = useCallback( () => {
		setReadResult( undefined );
		setWriteResult( undefined );
		setDeleteResult( undefined );
	}, [] );

	const objectName = useMemo(
		() => 'vfs-test-' + new Date().getTime() + '.txt',
		[]
	);

	const checkReadAccess = useCallback(
		async (
			filePath: string | VisitorUploadedFileClass
		): Promise< VisitorUploadedFileClass > =>
			swiftApi()
				.then( ( api ) => api.get( filePath ) )
				.catch( ( err: Error ) => {
					if (
						err instanceof HTTPStatusError &&
						err.status === 404
					) {
						setReadResult( true );
						throw err;
					}

					if ( err instanceof NetworkError ) {
						setReadResult( __( 'Network error occurred.', 'vfs' ) );
						throw err;
					}

					setReadResult(
						sprintf(
							// translators: %s is the error message.
							__(
								'An error occurred while checking read access: %s',
								'vfs'
							),
							err.message
						)
					);

					throw err;
				} )
				.then( ( file ) => {
					setReadResult( true );
					return file;
				} ),
		[ swiftApi ]
	);

	const checkWriteAccess = useCallback(
		async ( filePath: string ): Promise< VisitorUploadedFileClass > =>
			swiftApi()
				.then( ( api ) =>
					api.upload(
						filePath,
						new File(
							[
								'Testing write access from VFS plugin at ' +
									new Date().toISOString(),
							],
							filePath,
							{ type: 'text/plain' }
						),
						() => {}
					)
				)
				.catch( ( err: Error ) => {
					if ( err instanceof NetworkError ) {
						setWriteResult(
							__( 'Network error occurred.', 'vfs' )
						);
						throw err;
					}

					setWriteResult(
						sprintf(
							// translators: %s is the error message.
							__(
								'An error occurred while checking write access: %s',
								'vfs'
							),
							err.message
						)
					);

					throw err;
				} )
				.then( ( file ) => {
					warning( __( 'File uploaded', 'vfs' ) );
					setWriteResult( true );
					return file;
				} ),
		[ swiftApi ]
	);

	const checkDeleteAccess = useCallback(
		async (
			filePath: string | VisitorUploadedFileClass
		): Promise< void > =>
			swiftApi()
				.then( ( api ) => api.delete( filePath ) )
				.catch( ( err: Error ) => {
					if ( err instanceof NetworkError ) {
						setDeleteResult(
							__( 'Network error occurred.', 'vfs' )
						);
						throw err;
					}

					setDeleteResult(
						sprintf(
							// translators: %s is the error message.
							__(
								'An error occurred while checking delete access: %s',
								'vfs'
							),
							err.message
						)
					);

					throw err;
				} )
				.then( () => setDeleteResult( true ) ),
		[ swiftApi ]
	);

	return (
		<Flex direction="column">
			<FlexItem>
				<Flex>
					<FlexItem>
						<Button
							variant="primary"
							isBusy={ isChecking }
							onClick={ () => {
								setIsChecking( true );
								resetResults();
								checkWriteAccess( objectName )
									.then( checkReadAccess )
									.then( checkDeleteAccess )
									.finally( () => setIsChecking( false ) );
							} }
						>
							{ __( 'Check options', 'vfs' ) }
						</Button>
					</FlexItem>
					<FlexItem>
						{ ( undefined !== readResult ||
							undefined !== writeResult ||
							undefined !== deleteResult ) && (
							<Button variant="primary" onClick={ resetResults }>
								{ __( 'Clear results', 'vfs' ) }
							</Button>
						) }
					</FlexItem>
				</Flex>
			</FlexItem>
			<FlexItem>
				{ ( undefined !== readResult ||
					undefined !== writeResult ||
					undefined !== deleteResult ) && (
					<NoticeList
						notices={
							[
								{
									id: 'delete',
									status: getNoticeStatus( deleteResult ),
									isDismissible: undefined !== deleteResult,
									content: getNoticeContent(
										deleteResult,
										'delete'
									),
									actions: [
										{
											label: __( 'Check options', 'vfs' ),
											onClick: () => {
												setIsChecking( true );
												setDeleteResult( undefined );
												checkDeleteAccess(
													objectName
												).finally( () =>
													setIsChecking( false )
												);
											},
										},
									],
								},
								{
									id: 'read',
									status: getNoticeStatus( readResult ),
									isDismissible: undefined !== readResult,
									content: getNoticeContent(
										readResult,
										'read'
									),
									actions: [
										{
											label: __( 'Check options', 'vfs' ),
											onClick: () => {
												setIsChecking( true );
												setReadResult( undefined );
												checkReadAccess(
													objectName
												).finally( () =>
													setIsChecking( false )
												);
											},
										},
									],
								},
								{
									id: 'write',
									status: getNoticeStatus( writeResult ),
									isDismissible: undefined !== writeResult,
									content: getNoticeContent(
										writeResult,
										'write'
									),
									actions: [
										{
											label: __( 'Check options', 'vfs' ),
											onClick: () => {
												setIsChecking( true );
												setWriteResult( undefined );
												checkWriteAccess(
													objectName
												).finally( () =>
													setIsChecking( false )
												);
											},
										},
									],
								},
							].filter(
								( notice ) => notice.content !== undefined
							) as Array< NoticeItem >
						}
						onRemove={ ( id ) => {
							switch ( id ) {
								case 'read':
									setReadResult( undefined );
									break;
								case 'write':
									setWriteResult( undefined );
									break;
								case 'delete':
									setDeleteResult( undefined );
									break;
							}
						} }
					/>
				) }
			</FlexItem>
		</Flex>
	);
};
