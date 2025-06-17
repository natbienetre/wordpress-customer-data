import { dateToUnixTimestamp, Token } from './token';
import { normalizePath, pathDelimiter, pathJoin, relativeTo } from './swift';
import type { TokenV1 } from 'token';
import type WordPressUrl from 'wordpress/url';

export type VfsOptions = {
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
	vfsToken: string;

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

export type OpenstackEntry =
	| { subdir: string }
	| {
			name: string;
			content_type: string;
			bytes: number;
			last_modified: string;
	  };

export class SwiftConfiguration {
	protected readonly swiftOptions: OpenStackOptions;
	protected readonly wordpressUrl: WordPressUrl;

	constructor( swiftOptions: OpenStackOptions, wordpressUrl: WordPressUrl ) {
		this.swiftOptions = swiftOptions;
		this.wordpressUrl = wordpressUrl;
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

	/**
	 * Get the upload URL for this file.
	 * @param {string}                                                    filePath    File path
	 * @param {TemporaryPrefixedUrlQueryParams | TemporaryUrlQueryParams} queryParams Query parameters
	 * @return {URL} Upload URL
	 */
	fileURLWithParams(
		filePath: string,
		queryParams: TemporaryPrefixedUrlQueryParams | TemporaryUrlQueryParams
	): URL {
		return new URL(
			this.wordpressUrl.addQueryArgs(
				this.fileURL( filePath ).toString(),
				queryParams
			)
		);
	}

	prefix( subPath: string = '' ): string {
		return pathJoin( this.sitePrefix(), normalizePath( subPath ) );
	}

	swiftQueryParams(
		signature: string,
		expiresAt: Date | number
	): TemporaryPrefixedUrlQueryParams | TemporaryUrlQueryParams {
		const params = {} as TemporaryPrefixedUrlQueryParams;

		const prefix = this.prefix();
		if ( prefix ) {
			params.temp_url_prefix = prefix + pathDelimiter;
		}

		params.temp_url_sig = signature;
		if ( typeof expiresAt === 'number' ) {
			params.temp_url_expires = expiresAt;
		} else {
			params.temp_url_expires = dateToUnixTimestamp( expiresAt );
		}

		return params;
	}

	entryPath( prefix: string, entry: OpenstackEntry ): string {
		if ( 'subdir' in entry ) {
			return relativeTo(
				this.prefix(),
				pathJoin( prefix, entry.subdir )
			);
		}

		return relativeTo( this.prefix(), entry.name );
	}
}

export class VfsConfiguration extends SwiftConfiguration {
	constructor(
		public readonly vfsToken: Token< TokenV1 >,
		swiftOptions: OpenStackOptions,
		wordpressUrl: WordPressUrl
	) {
		super( swiftOptions, wordpressUrl );
	}

	userPrefix(): string {
		return encodeURIComponent( this.vfsToken?.data.user.id || '' );
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
		return normalizePath( this.vfsToken?.data.swift.pageSpace || '' );
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
	 * @return {string} Upload URL
	 */
	fileURL( filePath: string ): URL {
		const url = this.pageURL();
		url.pathname = pathJoin( url.pathname, filePath );
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

	fileURLForMethod( filePath: string, method: string ): URL {
		return this.fileURLWithParams(
			filePath,
			this.swiftQueryParamsForMethod( method )
		);
	}

	swiftQueryParamsForMethod(
		method: string
	): TemporaryPrefixedUrlQueryParams | TemporaryUrlQueryParams {
		const params = {} as TemporaryPrefixedUrlQueryParams;

		const prefix = this.prefix();
		if ( prefix ) {
			params.temp_url_prefix = prefix;
		}

		params.temp_url_sig = this.vfsToken.signature( method );
		if ( this.vfsToken.data.swift.expiresAt ) {
			params.temp_url_expires = this.vfsToken.data.swift.expiresAt;
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
