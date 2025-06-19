import { __, sprintf } from '../../libs/js/wordpress-interactive/i18n';

export const deleteTitle = ( name: string ) => {
	// translators: %s is the name of the file.
	return sprintf( __( 'Delete %s', 'customer-data' ), name );
};

export const deleteConfirmation = ( name: string ) => {
	// translators: %s is the name of the file.
	return sprintf( __( 'Are you sure you want to delete %s?', 'customer-data' ), name );
};

export default {
	deleteTitle,
	deleteConfirmation,
};
