import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { key, plusCircle } from '@wordpress/icons';
import { useCommand } from '@wordpress/commands';
import { Button, Modal } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { JSONWebKeySetList } from '../../libs/js/components/JSONWebKeySetList';
import { store as jwksStore } from '../../libs/js/jwks';
import apiFetch from '../../libs/js/wordpress/api-fetch';

export const Render = () => {
	const [ isOpen, setIsOpen ] = useState( false );
	const generateKey = useDispatch( jwksStore ).generate;

	useCommand( {
		name: 'customer-data/jwks-list',
		label: __( 'JSON Web Key Set list' ),
		icon: key,
		callback: ( { close }: { close: () => void } ) => {
			close();
			setIsOpen( true );
		},
	} );

	return (
		isOpen && (
			<Modal
				isDismissible={ true }
				focusOnMount={ true }
				shouldCloseOnEsc={ true }
				shouldCloseOnClickOutside={ true }
				onRequestClose={ () => setIsOpen( false ) }
				title={ __( 'JSON Web Key Set list', 'customer-data' ) }
				headerActions={
					<Button
						__next40pxDefaultSize
						onClick={ () => generateKey( apiFetch ) }
						icon={ plusCircle }
						label={ __( 'Generate a key', 'customer-data' ) }
					/>
				}
			>
				<JSONWebKeySetList />
			</Modal>
		)
	);
};
