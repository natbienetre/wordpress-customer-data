import { describe, it, expect } from '@jest/globals';
import { Token, dateToUnixTimestamp } from '../token';
import type { TokenV1, HttpMethod } from '../types/token';

describe( 'Token', () => {
	const mockSignatures = {
		GET: 'get-signature',
		POST: 'post-signature',
		PUT: 'put-signature',
		DELETE: 'delete-signature',
	} as { [ k in HttpMethod ]: string };

	describe( 'constructor', () => {
		it( 'should create a token with all properties', () => {
			const token = new Token( {
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
			} );

			expect( token.data.version ).toBe( '1' );
			expect( token.data.user.id ).toBe( 'test-user' );
			expect( token.data.swift.pageSpace ).toBe( 'test-space' );
			expect( token.data.swift.signatures.GET ).toBe( 'get-signature' );
		} );

		it( 'should throw error for unsupported version', () => {
			expect(
				() =>
					new Token( {
						version: 'test' as any,
						user: {
							id: 'test-user',
							email: null,
							displayName: null,
						},
						swift: {
							pageSpace: 'test-space',
							signatures: mockSignatures,
							expiresAt: 1234567890,
						},
					} )
			).toThrow( 'Unsupported token version: test' );
		} );
	} );

	describe( 'serialize', () => {
		it( 'should serialize token to base64', async () => {
			const mockApiFetch = jest
				.fn()
				.mockResolvedValue( { token: 'mock-serialized-token' } );
			const data = {
				version: '1',
				user: { id: 'test-user', email: null, displayName: null },
				swift: {
					pageSpace: 'test-pageSpace',
					signatures: mockSignatures,
					expiresAt: dateToUnixTimestamp( new Date() ),
				},
			} as TokenV1;
			const token = new Token< TokenV1 >( data );
			const serialized = await token.serialize( null, mockApiFetch );

			expect( typeof serialized ).toBe( 'string' );
			expect( serialized.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'signature', () => {
		it( 'should return the correct signature for a method', () => {
			const token = new Token( {
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
			} );

			expect( token.signature( 'GET' ) ).toBe( 'get-signature' );
			expect( token.signature( 'POST' ) ).toBe( 'post-signature' );
		} );

		it( 'should handle case-insensitive method names', () => {
			const token = new Token< TokenV1 >( {
				version: '1',
				user: { id: 'test-user', email: null, displayName: null },
				swift: {
					pageSpace: 'test-pageSpace',
					signatures: mockSignatures,
					expiresAt: dateToUnixTimestamp( new Date() ),
				},
			} );
			expect( token.signature( 'get' ) ).toBe( 'get-signature' );
			expect( token.signature( 'post' ) ).toBe( 'post-signature' );
		} );
	} );

	describe( 'expired', () => {
		it( 'should return false for non-expired token', () => {
			const futureDate = new Date();
			futureDate.setFullYear( futureDate.getFullYear() + 1 );
			const token = new Token< TokenV1 >( {
				version: '1',
				user: { id: 'test-user', email: null, displayName: null },
				swift: {
					pageSpace: 'test-pageSpace',
					signatures: mockSignatures,
					expiresAt: dateToUnixTimestamp( futureDate ),
				},
			} );
			expect( token.expired() ).toBe( false );
		} );

		it( 'should return true for expired token', () => {
			const pastDate = new Date();
			pastDate.setFullYear( pastDate.getFullYear() - 1 );
			const token = new Token< TokenV1 >( {
				version: '1',
				user: { id: 'test-user', email: null, displayName: null },
				swift: {
					pageSpace: 'test-pageSpace',
					signatures: mockSignatures,
					expiresAt: dateToUnixTimestamp( pastDate ),
				},
			} );
			expect( token.expired() ).toBe( true );
		} );
	} );

	describe( 'expiredAt', () => {
		it( 'should return false for token without expiration', () => {
			const token = new Token< TokenV1 >( {
				version: '1',
				user: { id: 'test-user', email: null, displayName: null },
				swift: {
					pageSpace: 'test-pageSpace',
					signatures: mockSignatures,
					expiresAt: 0,
				},
			} );
			expect( token.expiredAt() ).toBe( false );
		} );

		it( 'should return expiration date for token with expiration', () => {
			const expiresAt = new Date();
			const token = new Token< TokenV1 >( {
				version: '1',
				user: { id: 'test-user', email: null, displayName: null },
				swift: {
					pageSpace: 'test-pageSpace',
					signatures: mockSignatures,
					expiresAt: dateToUnixTimestamp( expiresAt ),
				},
			} );
			const result = token.expiredAt();
			expect( result ).toBeInstanceOf( Date );
			expect( dateToUnixTimestamp( result as Date ) ).toEqual(
				dateToUnixTimestamp( expiresAt )
			);
		} );
	} );
} );
