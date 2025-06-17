import type { JWTPayload, JWSHeaderParameters, CryptoKey } from 'jose';

export { jwtVerify, SignJWT };

export class SignatureVerificationError extends Error {
	constructor() {
		super( 'Failed to verify signature' );
		this.name = 'SignatureVerificationError';
	}
}

export class JWTVerifyResult< T extends JWTPayload = JWTPayload > {
	payload: T;
	protectedHeader: JWSHeaderParameters;

	constructor( payload: T, protectedHeader: JWSHeaderParameters ) {
		this.payload = payload;
		this.protectedHeader = protectedHeader;
	}
}

export class JWSSignatureVerificationFailed extends Error {
	constructor() {
		super( 'Failed to verify signature' );
		this.name = 'JWSSignatureVerificationFailed';
	}
}

export class JWTExpired extends Error {
	constructor() {
		super( 'JWT expired' );
		this.name = 'JWTExpired';
	}
}

// Mock implementation of jwtVerify that decodes the token without actual signature verification
async function jwtVerify< T extends JWTPayload = JWTPayload >(
	token: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	keyOrKeySet:
		| CryptoKey
		| ( (
				protectedHeader?: JWSHeaderParameters,
				token?: string
		  ) => Promise< CryptoKey > )
): Promise< JWTVerifyResult< T > > {
	const [ headerB64, payloadB64 ] = token.split( '.' );

	if ( ! headerB64 || ! payloadB64 ) {
		throw new Error( 'Invalid token format' );
	}

	const header = JSON.parse( atob( headerB64 ) );
	const payload = JSON.parse( atob( payloadB64 ) );

	// Check expiration
	if ( payload.exp && payload.exp < Math.floor( Date.now() / 1000 ) ) {
		throw new JWTExpired();
	}

	return new JWTVerifyResult( payload, header );
}

class SignJWT {
	private payload: any = {};
	private protectedHeader: JWSHeaderParameters = {};

	constructor( payload: any = {} ) {
		this.payload = payload;
	}

	setProtectedHeader( header: JWSHeaderParameters ) {
		this.protectedHeader = header;
		return this;
	}

	setIssuedAt() {
		this.payload.iat = Math.floor( Date.now() / 1000 );
		return this;
	}

	setExpirationTime( exp: string | number ) {
		if ( typeof exp === 'string' ) {
			const hours = parseInt( exp );
			this.payload.exp = Math.floor( Date.now() / 1000 ) + hours * 3600;
		} else {
			this.payload.exp = exp;
		}
		return this;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async sign( key: CryptoKey ): Promise< string > {
		const header = btoa( JSON.stringify( this.protectedHeader ) );
		const payload = btoa( JSON.stringify( this.payload ) );
		const signature = btoa( 'mock-signature' );
		return `${ header }.${ payload }.${ signature }`;
	}
}

export type { JWTPayload, JWSHeaderParameters, CryptoKey };
