import type { HttpMethod, TokenV1, UserDataV1 } from 'token';
import {
	allMethods,
	dateToUnixTimestamp,
	TemporaryPrefixedUrlSignature,
	Token,
} from './token';
import { normalizePath, pathDelimiter, pathJoin } from './swift';
import type ApiFetch from 'wordpress/api-fetch';

export const generateUserToken = async (
	user: UserDataV1,
	suffix: string,
	expiresAt: Date,
	pageSpace: string,
	apiFetch: ApiFetch< {
		signature: string;
	} >,
	methods: HttpMethod[] = allMethods
): Promise< Token< TokenV1 > > => {
	suffix = normalizePath( suffix ) + pathDelimiter;

	return Promise.all(
		methods.map( ( method ) =>
			generatePrefixedSignature(
				method,
				// TODO Use pagespace here?
				user.id ? pathJoin( user.id, suffix ) : suffix,
				expiresAt,
				apiFetch
			)
		)
	).then(
		( signatures ) =>
			new Token( {
				version: '1',
				user,
				swift: {
					pageSpace,
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
};

export const generatePrefixedSignature = async (
	method: HttpMethod,
	swiftSuffix: string,
	expiresAt: Date,
	apiFetch: ApiFetch< {
		signature: string;
	} >
): Promise< TemporaryPrefixedUrlSignature > => {
	return apiFetch( {
		path: '/vfs/v1/swift/signature',
		method: 'POST',
		body: JSON.stringify( {
			method,
			expiresAt,
			pathPrefix: normalizePath( swiftSuffix ),
		} ),
	} ).then( ( response ) => response.signature );
};
