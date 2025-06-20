/**
 * CustomerData Upload Handler
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description Handles file uploads to Swift storage.
 */

import { getContext, getElement, store } from '@wordpress/interactivity';
import { unixTimestampToDate } from '../libs/js/token';
import type { HttpMethod } from 'token';
import { sprintf, __ } from '../libs/js/wordpress-interactive/i18n';
import * as jose from 'jose';

type CustomerDataAdminToolsContext = {
	token:
		| {
				payload: {
					version: string;
					user: {
						firstName: string;
						lastName: string;
						email: string;
					};
					swift: {
						expiresAt: number;
						pageSpace: string;
						signatures: Record< HttpMethod, string >;
					};
				} | null;
				metadata: {
					algorithm: string | null;
				};
				validity: {
					valid: boolean;
					notices: string[];
				};
		  }
		| false;
};

const { state } = store( 'customer-data-admin-tools-token-inspection', {
	state: {
		expirationDate(): string {
			const context = getContext() as CustomerDataAdminToolsContext;
			if ( ! context.token || ! context.token.payload ) {
				return '';
			}

			const d = unixTimestampToDate(
				context.token.payload.swift.expiresAt
			);

			return (
				window.gmdateI18n( state.dateFormat, d ) ?? d.toLocaleString()
			);
		},
		expirationDatetime(): string {
			const context = getContext() as CustomerDataAdminToolsContext;
			if ( ! context.token || ! context.token.payload ) {
				return '';
			}

			return unixTimestampToDate(
				context.token.payload.swift.expiresAt
			).toLocaleString();
		},
		expired() {
			const context = getContext() as CustomerDataAdminToolsContext;
			if ( ! context.token || ! context.token.payload ) {
				return false;
			}

			return (
				unixTimestampToDate( context.token.payload.swift.expiresAt ) <
				new Date()
			);
		},
	},
	context: {
		token: false,
	} as CustomerDataAdminToolsContext,
	callbacks: {
		inspectToken: () => {
			const input = getElement().ref as HTMLInputElement;

			const token = input.value;

			const context = getContext() as CustomerDataAdminToolsContext;

			if ( ! token ) {
				context.token = false;
				return;
			}

			try {
				const header = jose.decodeProtectedHeader( token );
				context.token = {
					payload: jose.decodeJwt( token ),
					metadata: {
						algorithm: header.alg ?? null,
					},
					validity: {
						valid: true,
						notices: [],
					},
				};
			} catch ( error: any ) {
				context.token = {
					payload: null,
					metadata: {
						algorithm: null,
					},
					validity: {
						valid: false,
						notices: [
							sprintf(
								// translators: %s is the error message.
								__( 'Invalid token: %s', 'customer-data' ),
								error.message
							),
						],
					},
				};
			}
		},
		pushHistory: () => {
			const input = getElement().ref as HTMLInputElement;
			if ( input ) {
				const value = input.value.trim();
				const url = new URL( window.location.href );
				if ( value.length > 0 ) {
					url.searchParams.set( 'customer-data-token-inspection-token', value );
				} else {
					url.searchParams.delete( 'customer-data-token-inspection-token' );
				}
				history.replaceState( null, '', url.toString() );
			}
		},
	},
} );
