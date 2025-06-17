import { getElement, store } from '@wordpress/interactivity';
import url from '../../libs/js/wordpress-interactive/url';

const queryParams = new URLSearchParams( window.location.search );

const { actions } = store( 'vfs', {
	state: {
		encodedToken: queryParams.get( 'vfs_token' ),
	},
	actions: {
		updateToken: async () => {
			const input = getElement().ref as HTMLInputElement;
			const currentUrl = url.removeQueryArgs(
				window.location.toString(),
				'vfs_token'
			);
			const destination = input.value
				? url.addQueryArgs( currentUrl, { vfs_token: input.value } )
				: currentUrl;

			window.history.replaceState( 'vfs-token', '', destination );

			actions.updateTokenFromQueryParams();
		},
	},
} ) as any as {
	actions: {
		updateTokenFromQueryParams: () => Promise< void >;
	};
};
