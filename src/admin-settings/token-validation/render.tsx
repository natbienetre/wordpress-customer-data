import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { bug } from '@wordpress/icons';
import { useCommand } from '@wordpress/commands';
import { Modal } from '@wordpress/components';
import { TokenInspection } from '../../libs/js/components/TokenValidation';

export const Render = () => {
	const [ isOpen, setIsOpen ] = useState( false );

	useCommand( {
		name: 'customer-data/token-validation',
		label: __( 'Inspect a token', 'customer-data' ),
		icon: bug,
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
				title={ __( 'Inspect a token', 'customer-data' ) }
			>
				<TokenInspection focusOnMount={ true } />
			</Modal>
		)
	);
};
