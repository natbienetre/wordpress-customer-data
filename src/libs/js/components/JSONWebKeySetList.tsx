import {
	Button,
	Flex,
	FlexBlock,
	FlexItem,
	Notice,
	PanelRow,
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { RawHTML, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { trash } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as jwksStore } from '../jwks';

export const JSONWebKeySetList: React.FC = (): JSX.Element => {
	const keys = useSelect(
		( select ) => select( jwksStore ).all( apiFetch ),
		[]
	);
	const [ error, setError ] = useState< string | null >( null );
	const [ confirmingDelete, setConfirmingDelete ] = useState<
		string | undefined
	>( undefined );

	const deleteKey = useDispatch( jwksStore ).delete;

	return (
		<>
			<ConfirmDialog
				isOpen={ undefined !== confirmingDelete }
				onConfirm={ () =>
					deleteKey( apiFetch, confirmingDelete! )
						.catch( ( err ) => {
							setError(
								sprintf(
									// translators: %1$s is the key ID, %2$s is the error message.
									__(
										'Failed to delete key %1$s: %2$s',
										'customer-data'
									),
									confirmingDelete,
									err.message
								)
							);
							throw err;
						} )
						.finally( () => setConfirmingDelete( undefined ) )
				}
				onCancel={ () => setConfirmingDelete( undefined ) }
			>
				<p>
					{ __( 'Are you sure you want to delete this key?', 'customer-data' ) }
				</p>
				<p>{ __( 'This action cannot be undone.', 'customer-data' ) }</p>
				<p>
					{ __(
						'This action will delete the key from the server and invalidate all tokens signed with it.',
						'customer-data'
					) }
				</p>
			</ConfirmDialog>
			{ error && (
				<Notice status="error">
					<RawHTML>{ error }</RawHTML>
				</Notice>
			) }
			{ keys!.keys.map( ( jwk, index ) => (
				<PanelRow key={ index }>
					<Flex justify="flex-start">
						<FlexItem>
							<Button
								isPrimary
								onClick={ () => {
									setError( null );
									setConfirmingDelete( jwk.x );
								} }
								icon={ trash }
								isDestructive={ true }
								variant="link"
							>
								{ __( 'Delete', 'customer-data' ) }
							</Button>
						</FlexItem>
						<FlexItem>{ jwk.alg }</FlexItem>
						<FlexItem>{ jwk.crv }</FlexItem>
						<FlexItem>{ jwk.kty }</FlexItem>
						<FlexBlock
							style={ {
								whiteSpace: 'nowrap',
								textOverflow: 'ellipsis',
								overflow: 'hidden',
							} }
						>
							{ jwk.x }
						</FlexBlock>
					</Flex>
				</PanelRow>
			) ) }
		</>
	);
};
