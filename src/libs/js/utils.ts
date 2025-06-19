import type I18n from 'wordpress/i18n';

export const getErrorMessage = ( i18n: I18n, err: unknown ): string => {
	if ( err instanceof Error ) {
		return err.message;
	}

	if ( typeof err === 'string' ) {
		return err;
	}

	return i18n.sprintf(
		// translators: %s is the error message
		i18n.__( 'An unknown error occurred: %s', 'customer-data' ),
		err
	);
};
