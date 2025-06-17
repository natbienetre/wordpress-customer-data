import { formatFileSize } from '../format';

describe( 'formatFileSize', () => {
	it( 'should return 0 Bytes for 0 bytes', () => {
		expect( formatFileSize( 0 ) ).toBe( '0 Bytes' );
	} );

	it( 'should format bytes correctly', () => {
		expect( formatFileSize( 500 ) ).toBe( '500 Bytes' );
	} );

	it( 'should format kilobytes correctly', () => {
		expect( formatFileSize( 1024 ) ).toBe( '1 KB' );
		expect( formatFileSize( 2048 ) ).toBe( '2 KB' );
	} );

	it( 'should format megabytes correctly', () => {
		expect( formatFileSize( 1024 * 1024 ) ).toBe( '1 MB' );
		expect( formatFileSize( 2.5 * 1024 * 1024 ) ).toBe( '2.5 MB' );
	} );

	it( 'should format gigabytes correctly', () => {
		expect( formatFileSize( 1024 * 1024 * 1024 ) ).toBe( '1 GB' );
		expect( formatFileSize( 2.5 * 1024 * 1024 * 1024 ) ).toBe( '2.5 GB' );
	} );

	it( 'should handle decimal values correctly', () => {
		expect( formatFileSize( 1500 ) ).toBe( '1.46 KB' );
		expect( formatFileSize( 1500000 ) ).toBe( '1.43 MB' );
	} );
} );
