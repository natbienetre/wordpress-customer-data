import hooks from '../libs/js/wordpress-interactive/hooks';

export const InitAction = 'customer-data-init';

export const addInitCallback = ( namespace: string, callback: () => void ) => {
	if ( hooks.didAction( InitAction ) ) {
		callback();
	} else {
		hooks.addAction( InitAction, namespace, callback );
	}
};

export const removeInitCallback = ( namespace: string ) => {
	hooks.removeAction( InitAction, namespace );
};
