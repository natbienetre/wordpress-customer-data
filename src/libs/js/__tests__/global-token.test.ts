import { describe, it, expect } from '@jest/globals';
import { getToken } from '../global-token';
import apiFetch from '../wordpress/api-fetch';

describe( 'getToken', () => {
	it( 'should parse token from URL parameters', async () => {
		// Create a valid JWT token for testing
		const mockTokenData = {
			version: '1',
			user: {
				id: 'test-user',
				email: 'test@example.com',
				displayName: 'Test User',
			},
			swift: {
				pageSpace: 'test-space',
				signatures: {
					GET: 'get-signature',
					POST: 'post-signature',
					PUT: 'put-signature',
					DELETE: 'delete-signature',
				},
				expiresAt: 1234567890,
			},
		};

		// Create a mock JWT token
		const header = btoa( JSON.stringify( { alg: 'HS256', typ: 'JWT' } ) );
		const payload = btoa( JSON.stringify( mockTokenData ) );
		const signature = btoa( 'mock-signature' );
		const serializedToken = `${ header }.${ payload }.${ signature }`;

		const mockWindow = {
			vfsToken: undefined,
			location: {
				search: `?vfs_token=${ serializedToken }`,
			},
		} as unknown as Window & globalThis.Window;

		const token = await getToken( mockWindow, apiFetch );
		expect( token.user.id ).toBe( 'test-user' );
		expect( token.swift.pageSpace ).toBe( 'test-space' );
	} );

	it( 'should throw error when token is not found in URL parameters', () => {
		const mockWindow = {
			vfsToken: undefined,
			location: { search: '?other_param=value' },
		} as unknown as Window & globalThis.Window;

		expect( getToken( mockWindow, apiFetch ) ).rejects.toThrow(
			'Token not found in query parameters'
		);
	} );

	it( 'should throw error when token is invalid', () => {
		const mockWindow = {
			vfsToken: undefined,
			location: { search: '?vfs_token=invalid_token' },
		} as unknown as Window & globalThis.Window;

		expect( getToken( mockWindow, apiFetch ) ).rejects.toThrow(
			'Invalid token'
		);
	} );
} );
