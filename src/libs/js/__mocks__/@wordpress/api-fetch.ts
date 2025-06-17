import type { APIFetchOptions } from '@wordpress/api-fetch';
import { SignJWT } from 'jose';
import { generateKeyPair } from 'crypto';
import { promisify } from 'util';

// Generate an Ed25519 key pair for testing
const generateKeyPairAsync = promisify( generateKeyPair );

// Generate and store the key pair
let keyPair: { publicKey: any; privateKey: any } | null = null;

const getKeyPair = async () => {
	if ( ! keyPair ) {
		keyPair = await generateKeyPairAsync( 'ed25519', {
			publicKeyEncoding: { type: 'spki', format: 'pem' },
			privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
		} );
	}
	return keyPair;
};

const apiFetch = jest
	.fn()
	.mockImplementation( async ( options: APIFetchOptions ) => {
		if ( options.path === '/vfs/v1/jwks/sign' ) {
			const body = JSON.parse( options.body as string );
			const payload = JSON.parse( body.payload );

			const { privateKey } = await getKeyPair();

			// Créer un JWT valide avec EdDSA
			const jwt = new SignJWT( payload )
				.setProtectedHeader( {
					alg: 'EdDSA',
					typ: 'JWT',
					crv: 'Ed25519',
				} )
				.setIssuedAt()
				.setExpirationTime( '2h' );

			const token = await jwt.sign( privateKey );

			return {
				token,
				key: {
					kty: 'OKP',
					crv: 'Ed25519',
					alg: 'EdDSA',
					use: 'sig',
				},
			};
		}
		if ( options.path === '/vfs/v1/jwks' ) {
			const { publicKey } = await getKeyPair();
			return Promise.resolve( {
				keys: [
					{
						kty: 'OKP',
						crv: 'Ed25519',
						alg: 'EdDSA',
						use: 'sig',
						x: publicKey.toString( 'base64url' ),
					},
				],
			} );
		}
		return Promise.reject( new Error( 'Not found' ) );
	} );

export default apiFetch;
