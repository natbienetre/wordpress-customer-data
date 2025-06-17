import '@wordpress/jest-console';
import { TextEncoder, TextDecoder } from 'node:util';

Object.defineProperty( global, 'TextEncoder', {
	value: TextEncoder,
} );

Object.defineProperty( global, 'TextDecoder', {
	value: TextDecoder,
} );

// Polyfill for structuredClone
global.structuredClone = ( obj: any ) => JSON.parse( JSON.stringify( obj ) );

// Mock window.fetch
global.fetch = jest.fn();

// Mock window.crypto for jose
Object.defineProperty( global, 'crypto', {
	value: {
		subtle: {
			importKey: jest.fn().mockResolvedValue( 'test-key' ),
			sign: jest.fn().mockResolvedValue( new Uint8Array( [ 1, 2, 3 ] ) ),
			verify: jest.fn().mockResolvedValue( true ),
		},
	},
} );

beforeEach( () => {
	jest.clearAllMocks();
} );
