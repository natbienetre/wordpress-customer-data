/**
 * Get token data from URL parameters and make it available globally.
 *
 * @since 1.0.0
 */

import type { VersionnedTokenData } from 'token';
import {
	createLocalJWKSet,
	errors,
	type FlattenedJWSInput,
	type JWSHeaderParameters,
	jwtVerify,
	type JWTVerifyResult,
	type JSONWebKeySet,
} from 'jose';
import { TokenQueryParams } from './const';
import type ApiFetch from 'wordpress/api-fetch';

export const localKeySet = async (
	window: Window & globalThis.Window,
	apiFetch: ApiFetch< JSONWebKeySet >
): Promise< JSONWebKeySet > => {
	if ( undefined !== window.customerDataKeys ) {
		return window.customerDataKeys;
	}

	return apiFetch( { path: '/customerData/v1/jwks' } ).then( ( keys ) => {
		window.customerDataKeys = keys as JSONWebKeySet;
		return window.customerDataKeys;
	} );
};

export const verifyToken = async (
	token: string,
	jwks: (
		protectedHeader?: JWSHeaderParameters,
		token?: FlattenedJWSInput
	) => Promise< CryptoKey >
): Promise< JWTVerifyResult< VersionnedTokenData > > => {
	return jwtVerify< VersionnedTokenData >( token, jwks ).catch(
		async ( error ) => {
			if ( 'ERR_JWKS_MULTIPLE_MATCHING_KEYS' !== error?.code ) {
				throw error;
			}

			for await ( const publicKey of error ) {
				try {
					return await jwtVerify< VersionnedTokenData >(
						token,
						publicKey
					);
				} catch ( innerError: any ) {
					if (
						innerError?.code ===
						'ERR_JWS_SIGNATURE_VERIFICATION_FAILED'
					) {
						continue;
					}
					throw innerError;
				}
			}

			throw new errors.JWSSignatureVerificationFailed(
				'No valid key found'
			);
		}
	);
};

export const getToken = async (
	window: Window & globalThis.Window,
	apiFetch: ApiFetch< JSONWebKeySet >
): Promise< VersionnedTokenData > => {
	const urlParams = new URLSearchParams( window.location.search );
	const token = urlParams.get( TokenQueryParams );
	if ( ! token ) {
		throw new Error( 'Token not found in query parameters' );
	}

	return localKeySet( window, apiFetch )
		.then( createLocalJWKSet )
		.then( ( jwks ) => verifyToken( token, jwks ) )
		.then( ( result ) => result.payload as VersionnedTokenData )
		.catch( ( error ) => {
			throw new Error( 'Invalid token', { cause: error } );
		} );
};
