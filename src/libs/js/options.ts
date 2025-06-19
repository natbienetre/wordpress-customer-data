import { Token } from './token';
import { normalizePath, pathJoin } from './swift';
import type { TokenV1 } from 'token';

export type CustomerDataOptions = {
	/**
	 * The base URL of the OpenStack Swift account.
	 * Example: https://storage.example.com/v1/AUTH_123456/
	 */
	accountUrl: string;

	/**
	 * The container name.
	 * Example: my-container
	 */
	container: string;

	/**
	 * The additional prefix for the container.
	 * Example: my-prefix/
	 */
	additionalPrefix: string;

	/**
	 * The page space.
	 * Example: my-page-space
	 */
	pageSpace: string;

	/**
	 * The user name.
	 * Example: my-user
	 */
	user: string;

	/**
	 * The JSON Web Token.
	 * Example: xxxxxheaderxxxxx.yyyyypayloadyyyyy.zzzzzsignaturezzzzz
	 */
	customerDataToken: string;

	/**
	 * The signature HMAC algorithm.
	 * Example: SHA-256
	 */
	signatureHmacAlgo: string;
};

export type OpenStackOptions = {
	swiftBaseUrl: string;
	container: string;
	prefix: string;
};

declare global {
	interface Window {
		customerDataOptions: CustomerDataOptions | undefined;
	}
}

export {};

export class SwiftConfiguration {
	protected readonly swiftOptions: OpenStackOptions;

	constructor( swiftOptions: OpenStackOptions ) {
		this.swiftOptions = swiftOptions;
	}

	/**
	 * Get the account URL.
	 */
	accountURL(): URL {
		return new URL( this.swiftOptions.swiftBaseUrl.replace( /\/$/, '' ) );
	}

	/**
	 * Get the container URL.
	 */
	containerURL(): URL {
		const url = new URL( this.accountURL() );
		url.pathname = pathJoin( url.pathname, this.swiftOptions.container );
		return url;
	}

	sitePrefix(): string {
		return normalizePath( this.swiftOptions.prefix );
	}

	/**
	 * Get the upload URL for this site.
	 */
	siteURL(): URL {
		const url = new URL( this.containerURL() );
		url.pathname = pathJoin( url.pathname, this.sitePrefix() );
		return url;
	}

	/**
	 * Get the upload URL for this file.
	 * @param {string} filePath File path
	 * @return {string} Upload URL
	 */
	fileURL( filePath: string ): URL {
		const url = this.siteURL();
		url.pathname = pathJoin( url.pathname, filePath );
		return url;
	}

	filePath( fileURL: string | URL ): string {
		return fileURL
			.toString()
			.substring( this.siteURL().toString().length + 1 );
	}
}

export class CustomerDataConfiguration extends SwiftConfiguration {
	constructor(
		public readonly customerDataToken: Token< TokenV1 >,
		swiftOptions: OpenStackOptions
	) {
		super( swiftOptions );
	}

	userPrefix(): string {
		return encodeURIComponent( this.customerDataToken?.data.user.id || '' );
	}

	/**
	 * Get the upload URL for this user.
	 */
	userURL(): URL {
		const url = new URL( this.siteURL() );
		url.pathname = pathJoin( url.pathname, this.userPrefix() );
		return url;
	}

	pagePrefix(): string {
		return normalizePath( this.customerDataToken?.data.swift.pageSpace || '' );
	}

	/**
	 * Get the upload URL for this page.
	 */
	pageURL(): URL {
		const url = new URL( this.userURL() );
		url.pathname = pathJoin( url.pathname, this.pagePrefix() );
		return url;
	}

	/**
	 * Get the upload URL for this file.
	 * @param {string} filePath File path
	 * @param          method
	 * @return {string} Upload URL
	 */
	fileURL( filePath: string, method: string | undefined = undefined ): URL {
		const url = this.pageURL();
		url.pathname = pathJoin( url.pathname, filePath );
		if ( undefined !== method ) {
			const params = this.swiftQueryParams( method );
			for ( const [ key, value ] of Object.entries( params ) ) {
				url.searchParams.set( key, value );
			}
		}

		return url;
	}

	filePath( fileURL: string ): string {
		return fileURL
			.toString()
			.substring( this.pageURL().toString().length + 1 );
	}

	prefix( subPath: string = '' ): string {
		return pathJoin(
			this.sitePrefix(),
			this.userPrefix(),
			this.pagePrefix(),
			normalizePath( subPath )
		);
	}

	swiftQueryParams(
		method: string
	): TemporaryPrefixedUrlQueryParams | TemporaryUrlQueryParams {
		const params = {} as TemporaryPrefixedUrlQueryParams;

		const prefix = this.prefix();
		if ( prefix ) {
			params.temp_url_prefix = prefix;
		}

		params.temp_url_sig = this.customerDataToken.signature( method );
		if ( this.customerDataToken.data.swift.expiresAt ) {
			params.temp_url_expires = this.customerDataToken.data.swift.expiresAt;
		}

		return params;
	}
}

export interface TemporaryPrefixedUrlQueryParams
	extends TemporaryUrlQueryParams {
	temp_url_prefix: string;
}

export interface TemporaryUrlQueryParams {
	temp_url_sig: string;
	temp_url_expires: number;
}
