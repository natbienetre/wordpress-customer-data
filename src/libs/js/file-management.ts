import { SwiftAPI } from './file-upload';
import {
	VfsOptions,
	OpenStackOptions,
	TemporaryPrefixedUrlQueryParams,
	TemporaryUrlQueryParams,
} from './options';
import { SwiftConfiguration } from './configuration';
import {
	allMethods,
	TemporaryPrefixedUrlSignature,
	dateToUnixTimestamp,
	Token,
} from './token';
import type { SerializedToken } from './token';
import type { JWK } from 'jose';
import type { HttpMethod, TokenV1, UserDataV1 } from 'token';
import { normalizePath, pathDelimiter, pathJoin } from './swift';
import { TokenQueryParams } from './const';
import type ApiFetch from 'wordpress/api-fetch';
import type WordPressUrl from 'wordpress/url';

export type OpenStackToken = string;

export interface VfsAdminConfig {
	options: VfsAdminOptions;
	keyManagement: KeyManagement;
	allowScopedTokens: boolean;
	keys: JWK[];
}

declare global {
	interface Window {
		vfsAdminConfig?: VfsAdminConfig;
	}
}

export interface OpenStackAdminOptions extends OpenStackOptions {
	token: string;
	authUrl: string;
	userDomainName: string;
	tenantId: string;
	tenantName: string;
	user: string;
	password: string;
}

export interface VfsAdminOptions extends VfsOptions, OpenStackAdminOptions {
	/**
	 * The signature key.
	 * Example: my-key
	 */
	signatureKey: string;
}

export interface KeyManagement {
	enabled: boolean;
	jwksUrl: string;
	mainKey: string;
}

export class VfsAdminConfiguration extends SwiftConfiguration {
	public readonly keyManagement: KeyManagement;

	constructor(
		public readonly vfsAdminConfig: VfsAdminConfig,
		public readonly wordpressUrl: WordPressUrl
	) {
		super( vfsAdminConfig.options, wordpressUrl );
		this.keyManagement = vfsAdminConfig.keyManagement;
	}
}

export class OpenStackConfigurationV3 {
	public readonly options: OpenStackAdminOptions;
	public readonly wordpressUrl: WordPressUrl;

	constructor( options: OpenStackAdminOptions, wordpressUrl: WordPressUrl ) {
		this.options = options;
		this.wordpressUrl = wordpressUrl;
	}

	newXhr( method: string, url: string ): XMLHttpRequest {
		const xhr = new XMLHttpRequest();
		xhr.open( method, url, true );
		return xhr;
	}

	do(
		xhr: XMLHttpRequest,
		body?: Document | XMLHttpRequestBodyInit | null,
		...expectedStatuses: number[]
	): Promise< XMLHttpRequest > {
		return new Promise( ( resolve, reject ) => {
			xhr.onload = () => {
				if ( ! expectedStatuses.includes( xhr.status ) ) {
					reject(
						new Error( `Unexpected status code: ${ xhr.status }` )
					);
				}
				resolve( xhr );
			};

			xhr.onerror = () => {
				reject( new Error( 'Network error occurred' ) );
			};

			xhr.send( body );
		} );
	}

	newToken(): Promise< OpenStackToken > {
		const xhr = new XMLHttpRequest();

		// https://docs.openstack.org/api-ref/identity/v3/#password-authentication-with-scoped-authorization
		xhr.open(
			'POST',
			this.wordpressUrl.addQueryArgs(
				`${ this.options.authUrl }/auth/tokens`,
				{
					nocatalog: 'true',
				}
			),
			true
		);

		xhr.setRequestHeader( 'Content-Type', 'application/json' );

		return this.do(
			xhr,
			JSON.stringify( {
				auth: {
					identity: {
						methods: [ 'password' ],
						password: {
							user: {
								name: this.options.user,
								domain: {
									name: this.options.userDomainName,
								},
								password: this.options.password,
							},
						},
					},
					/*
				"scope": {
					"system": {
						"all": true
					},
					"domain": {
						"name": this.userDomainName
					}
				}
				*/
				},
			} ),
			201
		).then( ( completedXhr ) => {
			const token = completedXhr.getResponseHeader( 'X-Subject-Token' );
			if ( ! token ) {
				throw new Error( 'No token found in response' );
			}

			return token;
		} );
	}
}

export class SwiftAdmin extends SwiftAPI {
	constructor(
		public readonly adminConfiguration: VfsAdminConfiguration,
		public readonly wordpressUrl: WordPressUrl,
		public readonly apiFetch: ApiFetch< any >
	) {
		super( adminConfiguration, wordpressUrl );
	}

	protected async newXhr(
		method: string,
		url: string
	): Promise< XMLHttpRequest > {
		return super.newXhr( method, url ).then( ( xhr ) => {
			xhr.setRequestHeader(
				'X-Auth-Token',
				this.adminConfiguration.vfsAdminConfig.options.token
			);
			return xhr;
		} );
	}

	protected async do(
		xhr: XMLHttpRequest,
		...expectedStatuses: number[]
	): Promise< XMLHttpRequest > {
		return super.do( xhr, ...expectedStatuses ).catch( ( error: any ) => {
			if (
				error instanceof Error &&
				error.cause instanceof XMLHttpRequest
			) {
				if ( error.cause.status === 401 ) {
					throw new Error(
						'Unauthorized. Please try again after refreshing the page.',
						{ cause: error.cause }
					);
				}
			}

			throw error;
		} );
	}

	async *users(
		cb: ( count: number, total: number ) => void = () => {}
	): AsyncIterable< string > {
		let total = 0;
		let processedItems = 0;
		let ignoreItems = 0;

		for await ( const item of this.list(
			this.adminConfiguration.sitePrefix(),
			( _, t ) => {
				total = t;
			}
		) ) {
			if ( typeof item === 'string' ) {
				processedItems++;
				yield item;
			} else {
				ignoreItems++;
			}

			cb( processedItems, total - ignoreItems );
		}
	}

	async generateAuthenticatedUrl(
		user: UserDataV1,
		suffix: string,
		landingPage: string | URL,
		expiresAt: Date,
		...methods: HttpMethod[]
	): Promise< URL > {
		landingPage =
			landingPage instanceof URL ? landingPage.toString() : landingPage;
		landingPage = this.wordpressUrl.removeQueryArgs(
			landingPage,
			TokenQueryParams
		);

		return this.generateUserToken( user, suffix, expiresAt, ...methods )
			.then( ( token ) =>
				token.serialize(
					this.adminConfiguration.keyManagement.mainKey
						? this.adminConfiguration.keyManagement.mainKey
						: null,
					this.apiFetch
				)
			)
			.then(
				( serializedToken: SerializedToken ) =>
					new URL(
						this.wordpressUrl.addQueryArgs( landingPage, {
							[ TokenQueryParams ]: serializedToken,
						} )
					)
			);
	}

	async signToken(
		token: Token< TokenV1 >,
		key: string | null
	): Promise< string > {
		return token.serialize( key, this.apiFetch );
	}

	async generateUserToken(
		user: UserDataV1,
		suffix: string,
		expiresAt: Date,
		...methods: HttpMethod[]
	): Promise< Token< TokenV1 > > {
		if ( methods.length === 0 ) {
			methods = allMethods;
		}
		suffix = normalizePath( suffix ) + pathDelimiter;

		return Promise.all(
			methods.map( ( method ) =>
				this.generatePrefixedSignature(
					method,
					// TODO Use pagespace here?
					user.id ? pathJoin( user.id, suffix ) : suffix,
					expiresAt
				)
			)
		).then(
			( signatures ) =>
				new Token( {
					version: '1',
					user,
					swift: {
						pageSpace:
							this.adminConfiguration.vfsAdminConfig.options
								.pageSpace,
						signatures: methods.reduce(
							( acc, method, index ) => {
								acc[ method ] = signatures[ index ];
								return acc;
							},
							{} as { [ k in HttpMethod ]: string }
						),
						expiresAt: dateToUnixTimestamp( expiresAt ),
					},
				} )
		);
	}

	async queryParams(
		method: HttpMethod,
		expiresAt: Date,
		swiftSuffix: string
	): Promise< TemporaryPrefixedUrlQueryParams | TemporaryUrlQueryParams > {
		return this.apiFetch( {
			path: '/vfs/v1/swift/signature',
			method: 'POST',
			body: JSON.stringify( {
				method,
				expiresAt,
				pathPrefix: normalizePath( swiftSuffix ) + pathDelimiter,
			} ),
		} ).then(
			( response: {
				signature: string;
				hmacAlgo: string;
				expiresAt: number;
			} ) =>
				this.adminConfiguration.swiftQueryParams(
					response.signature,
					response.expiresAt
				)
		);
	}

	async generatePrefixedSignature(
		method: HttpMethod,
		swiftSuffix: string,
		expiresAt: Date
	): Promise< TemporaryPrefixedUrlSignature > {
		return this.apiFetch( {
			path: '/vfs/v1/swift/signature',
			method: 'POST',
			body: JSON.stringify( {
				method,
				expiresAt,
				pathPrefix: normalizePath( swiftSuffix ),
			} ),
		} ).then(
			( response: {
				signature: string;
				hmacAlgo: string;
				expiresAt: number;
			} ) => response.signature
		);
	}
}
