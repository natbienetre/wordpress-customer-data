import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import '@wordpress/api-fetch';

import './tool-create-token.scss';

domReady( () => {
	document
		.querySelectorAll( '.token-result-container' )
		.forEach( ( element ) => {
			const button = element.querySelector(
				'.copy-button'
			) as HTMLButtonElement;
			let timeout: NodeJS.Timeout | undefined;
			button?.addEventListener( 'click', ( event ) => {
				event.preventDefault();
				event.stopPropagation();

				button.disabled = true;
				button.textContent = __( 'Copying…', 'vfs' );

				const token =
					element.querySelector( '.generated-token' )?.textContent;
				if ( token ) {
					navigator.clipboard.writeText( token ).then( () => {
						button.textContent = __( 'Copied!', 'vfs' );
						button.disabled = false;
						clearTimeout( timeout );
						timeout = setTimeout( () => {
							button.textContent = __( 'Copy', 'vfs' );
						}, 2000 );
					} );
				}
			} );
		} );
} );
