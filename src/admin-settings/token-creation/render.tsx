import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { bug, people } from '@wordpress/icons';
import { useCommand } from '@wordpress/commands';
import { Modal } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import {
	SwiftAdmin,
	CustomerDataAdminConfiguration,
} from '../../libs/js/file-management';
import wordpressUrl from '../../libs/js/wordpress/url';
import apiFetch from '../../libs/js/wordpress/api-fetch';
import { URLGenerationForm } from '../../libs/js/components/URLGenerationForm';

export const Render = () => {
	const [ isOpen, setIsOpen ] = useState( false );

	useCommand( {
		name: 'customer-data/token-creation',
		label: __( 'Create a token', 'customer-data' ),
		searchLabel: __( 'Generate a token', 'customer-data' ),
		icon: bug,
		callback: ( { close }: { close: () => void } ) => {
			close();
			setIsOpen( true );
		},
	} );

	const permalink = useSelect( ( select ) => {
		return select( editorStore ).getPermalink() || '';
	}, [] );

	const slug = useSelect( ( select ) => {
		return select( editorStore ).getEditedPostAttribute( 'slug' ) || '';
	}, [] );

	const swiftAdmin = useMemo(
		() =>
			new SwiftAdmin(
				new CustomerDataAdminConfiguration(
					{
						...window.customerDataAdminConfig!,
						options: {
							...window.customerDataAdminConfig!.options,
							pageSpace: '', // Generate global tokens only
						},
					},
					wordpressUrl
				),
				wordpressUrl,
				apiFetch
			),
		[]
	);

	return (
		isOpen && (
			<Modal
				icon={ people }
				title={ __( 'Temporary URL', 'customer-data' ) }
				onRequestClose={ () => setIsOpen( false ) }
			>
				<URLGenerationForm
					swiftAdmin={ swiftAdmin }
					landingPage={ permalink }
					defaultSuffix={ slug }
				/>
			</Modal>
		)
	);
};
