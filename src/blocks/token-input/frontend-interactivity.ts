import { getElement, store } from '@wordpress/interactivity';
import url from '../../libs/js/wordpress-interactive/url';

const queryParams = new URLSearchParams( window.location.search );

const { actions } = store( 'customer-data', {
	state: {
		encodedToken: queryParams.get( 'customer_data_token' ),
	},
	actions: {
		updateToken: async () => {
			const input = getElement().ref as HTMLInputElement;
			const currentUrl = url.removeQueryArgs(
				window.location.toString(),
				'customer_data_token'
			);
			const destination = input.value
				? url.addQueryArgs( currentUrl, { customer_data_token: input.value } )
				: currentUrl;

			window.history.replaceState( 'customer-data-token', '', destination );

			actions.updateTokenFromQueryParams();
		},
	},
} ) as any as {
	actions: {
		updateTokenFromQueryParams: () => Promise< void >;
	};
};
