/**
 * VFS Upload Handler
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description Handles file uploads to Swift storage.
 */

import {
	getContext,
	getElement,
	splitTask,
	store,
	withScope,
} from '@wordpress/interactivity';
import { __ } from '../libs/js/wordpress-interactive/i18n';
import { apiFetch } from '../libs/js/wordpress-interactive/api-fetch';
import { generateUserToken } from '../libs/js/token-admin';
import type { HttpMethod } from 'token';
import { parse as parseVCard } from 'vcard-parser';

type VfsAdminToolsTokenCreationContext = {
	user: {
		id: string;
		displayName: string;
		email: string;
	};
	error?: string;
	token?: string;
};

const { state } = store( 'vfs-admin-tools-token-creation', {
	state: {
		userId() {
			const context = getContext() as VfsAdminToolsTokenCreationContext;
			if ( context.user.email ) {
				return context.user.email;
			}

			if ( context.user.displayName ) {
				return context.user.displayName
					.replaceAll( ' ', '.' )
					.toLowerCase();
			}

			return __( 'Automatically computed', 'vfs' );
		},
		contactsAccept() {
			return 'contacts' in navigator
				? 'text/contacts+json;items=name,email'
				: '.vcf';
		},
	},
	callbacks: {
		async setContextAttribute() {
			const input = getElement().ref as HTMLInputElement | null;
			if ( input ) {
				const context =
					getContext() as VfsAdminToolsTokenCreationContext;
				context.user[
					input.dataset
						.userAttribute as keyof VfsAdminToolsTokenCreationContext[ 'user' ]
				] = input.value;
			}
		},
		*pickContacts( event: Event ) {
			if ( ! ( 'contacts' in navigator ) ) {
				// eslint-disable-next-line no-console
				console.debug( __( 'Contacts API not supported', 'vfs' ) );
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			yield splitTask();

			// todo handle error

			navigator.contacts
				.select( [ 'name', 'email' ], { multiple: false } )
				.then(
					(
						contacts: {
							name: string[];
							email: string[];
						}[]
					) => {
						if ( contacts.length === 0 ) {
							return;
						}

						contacts.forEach( ( contact ) => {
							setStringValue(
								'[name="vfs-token-creation-email"]',
								contact.email.shift()
							);
							setStringValue(
								'[name="vfs-token-creation-display-name"]',
								contact.name
									.map( ( n ) => n.trim() )
									.filter( Boolean )
									.shift()
							);
						} );
					}
				);
		},
		async readVCard() {
			const input = getElement().ref as HTMLInputElement | null;
			if ( ! input ) {
				return;
			}

			for ( const file of input.files ?? [] ) {
				const reader = new FileReader();
				reader.onloadend = withScope(
					( event: ProgressEvent< FileReader > ) => {
						const vcard = parseVCard(
							event.target?.result as string
						);

						setStringValue(
							'[name="vfs-token-creation-email"]',
							( vcard.email as { value: string }[] )
								.map( ( emailObject ) => emailObject.value )
								.filter( Boolean )
								.shift()
						);
						setStringValue(
							'[name="vfs-token-creation-display-name"]',
							( vcard.fn as { value: string }[] )
								.map( ( nameObject ) => nameObject.value )
								.filter( Boolean )
								.shift()
						);
					}
				);
				reader.readAsText( file );
			}
		},
		*createToken( event: SubmitEvent ) {
			const form = getElement().ref as HTMLFormElement | null;

			if ( ! form ) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			const submitButton = event.submitter as HTMLButtonElement | null;
			if ( submitButton ) {
				submitButton.value = __( 'Creating…', 'vfs' );
				submitButton.disabled = true;
			}

			const context = getContext() as VfsAdminToolsTokenCreationContext;

			context.error = undefined;
			context.token = undefined;

			yield splitTask();

			const data = new FormData( form );
			const expiresAt = data.get( 'vfs-token-creation-expires-at' );
			const userId = data.get( 'vfs-token-creation-user-id' );
			const displayName = data.get( 'vfs-token-creation-display-name' );
			const email = data.get( 'vfs-token-creation-email' );
			const pageSpace = data.get( 'vfs-token-creation-scope' );

			const readPermission = data.get(
				'vfs-token-creation-permissions-read'
			);
			const writePermission = data.get(
				'vfs-token-creation-permissions-write'
			);

			generateUserToken(
				{
					id: userId as string,
					displayName: displayName as string,
					email: email as string,
				},
				state.suffix ?? '',
				new Date( expiresAt as string ),
				pageSpace as string,
				apiFetch,
				( readPermission ? state.readPermissionMethods : [] ).concat(
					writePermission ? state.writePermissionMethods : []
				)
			)
				.then( ( token ) => token.serialize( null, apiFetch ) )
				.then(
					withScope( ( token: string ) => {
						const ctx =
							getContext() as VfsAdminToolsTokenCreationContext;
						ctx.token = token;
					} )
				)
				.catch(
					withScope( ( error ) => {
						const ctx =
							getContext() as VfsAdminToolsTokenCreationContext;
						ctx.error = error.message;
					} )
				)
				.finally( () => {
					if ( submitButton ) {
						submitButton.value = __( 'Create', 'vfs' );
						submitButton.disabled = false;
					}
				} );
		},
	},
	context: {
		user: {
			id: '',
			displayName: '',
			email: '',
		},
	} as VfsAdminToolsTokenCreationContext,
} ) as any as {
	state: {
		suffix?: string;
		readPermissionMethods: HttpMethod[];
		writePermissionMethods: HttpMethod[];
	};
};

const setStringValue = ( selector: string, value?: string ) => {
	if ( ! value ) {
		return;
	}

	const input = document.querySelector( selector ) as HTMLInputElement;
	if ( input ) {
		input.value = value;
		input.dispatchEvent( new Event( 'input' ) );
	}
};
