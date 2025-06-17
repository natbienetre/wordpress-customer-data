export type TokenVersion = '1';

/**
 * Type representing the generic versionned token data
 */
export type VersionnedTokenData = TokenV1;

/**************************************************
 * Version 1
 **************************************************/

/**
 * Type representing the supported HTTP methods
 */
export type HttpMethod = string;

/**
 * Type representing the version 1 of the token
 */
export type TokenV1 = {
	version: '1';
	user: UserDataV1;
	swift: {
		pageSpace: string;
		signatures: { [ k in HttpMethod ]: string };
		expiresAt: number;
	};
};

/**
 * Type representing the user data version 1
 */
export interface UserDataV1 {
	id: string;
	email: string | null;
	displayName: string | null;
}
