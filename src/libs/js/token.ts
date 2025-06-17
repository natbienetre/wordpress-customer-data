import type ApiFetch from 'wordpress/api-fetch';
import type { VersionnedTokenData, TokenV1, HttpMethod } from 'token';

export type SerializedToken = string;

export class Token< TokenData extends VersionnedTokenData > {
	public readonly data: TokenV1;

	constructor( data: TokenData ) {
		if ( '1' === data.version ) {
			const dataV1 = data as Partial< TokenV1 >;
			if (
				undefined === dataV1.user ||
				undefined === dataV1.swift ||
				undefined === dataV1.swift.pageSpace ||
				undefined === dataV1.swift.signatures ||
				undefined === dataV1.swift.expiresAt
			) {
				throw new Error(
					`Invalid token: missing required fields for version ${ data.version }`
				);
			}

			this.data = dataV1 as TokenV1;
		} else {
			throw new Error( `Unsupported token version: ${ data.version }` );
		}
	}

	async serialize(
		key: string | null = null,
		apiFetch: ApiFetch< {
			token: string;
			key: string;
		} >
	): Promise< SerializedToken > {
		return apiFetch( {
			path: '/vfs/v1/jwks/sign',
			method: 'POST',
			body: JSON.stringify( {
				payload: JSON.stringify( this.data ),
				...( key ? { key } : {} ),
			} ),
		} ).then( ( response ) => response.token );
	}

	signature( method: string ): string {
		const signatures = this.data.swift.signatures;
		return signatures[ method.toUpperCase() as keyof typeof signatures ];
	}

	expired(): boolean {
		if ( ! this.data.swift.expiresAt ) {
			return false;
		}
		return this.data.swift.expiresAt < dateToUnixTimestamp( new Date() );
	}

	/**
	 * Get the expiration date of the token or false if the token is not expired.
	 */
	expiredAt(): Date | false {
		return this.data.swift.expiresAt
			? unixTimestampToDate( this.data.swift.expiresAt )
			: false;
	}
}

export class TokenEvent extends CustomEvent< Token< VersionnedTokenData > > {
	constructor( token: Token< VersionnedTokenData > ) {
		super( 'vfs:token', { detail: token } );
	}
}

export const allMethods = [
	'GET',
	'PUT',
	'HEAD',
	'DELETE',
	'POST',
	'COPY',
] as HttpMethod[];

/**
 * Convert timestamp to Unix timestamp
 *
 * @param {Date} date The date to convert
 * @return {number} Unix timestamp
 */
export const dateToUnixTimestamp = ( date: Date ): number => {
	return Math.floor( date.getTime() / 1000 );
};

/**
 * Convert Unix timestamp to Date
 *
 * @param {number} timestamp The Unix timestamp to convert
 * @return {Date} The date
 */
export const unixTimestampToDate = ( timestamp: number ): Date => {
	return new Date( timestamp * 1000 );
};

/**
 * Type representing a temporary URL signature for a prefixed path
 */
export type TemporaryPrefixedUrlSignature = string;

/**
 * Type representing a temporary URL signature for a single path
 */
export type TemporarySinglePathUrlSignature = string;
