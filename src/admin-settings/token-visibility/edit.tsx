/**
 * File Upload Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block allows users to upload files.
 */

import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	Icon,
	type IconType,
	PanelBody,
	PanelRow,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pending } from '@wordpress/icons';
import { useCallback, useEffect } from '@wordpress/element';
import { TokenState } from '../../blocks/type';
import { addClassName, removeClassName } from '../../libs/js/classname';
import { useSelectVisibilityHelperPreference } from '../../libs/js/visibility-helper-preference';

import './edit.scss';

export interface Attributes {
	customerDataTokenShouldBe: TokenState[];
}

export const containerClassName = 'customer-data-block-visibility-helper';

export const GlobalTokenVisibilityHelper = () => {
	const value = useSelectVisibilityHelperPreference();
	/*
	console.log( value );

	const editorPreferences = useSelect( ( select ) => {
		return select( coreEditorStore ).getPreferences();
	}, [] );
	console.log( 'editorPreferences', editorPreferences );

	const preferences = useSelect( ( select ) => {
		return select( corePreferencesStore );
	}, [] );
	console.log( 'preferences', preferences );

	const settings = useSelect( ( select ) => {
		return select( coreSiteEditorStore );
	}, [] );
	console.log( 'settings', settings );
*/
	useEffect( () => {
		const container = document.querySelector( '.editor-styles-wrapper' );

		if ( value ) {
			container?.classList.add( containerClassName );
		} else {
			container?.classList.remove( containerClassName );
		}
	}, [ value ] );

	return null;
};

export const Edit: React.FC< {
	attributes: Attributes & { className?: string };
	setAttributes: (
		attributes: Partial< Attributes & { className?: string } >
	) => void;
} > = ( {
	attributes: { customerDataTokenShouldBe, className },
	setAttributes,
} ): JSX.Element => {
	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Visibility settings', 'customer-data' ) }
					icon={ <Icon icon="visibility" /> }
					initialOpen={ customerDataTokenShouldBe.length > 0 }
				>
					{ Object.entries( {
						valid: {
							label: __( 'Display if the token is valid', 'customer-data' ),
							icon: <ValidIcon />,
						},
						invalid: {
							label: __(
								'Display if the token is invalid',
								'customer-data'
							),
							icon: <InvalidIcon />,
						},
						loading: {
							label: __(
								'Display if the token is loading',
								'customer-data'
							),
							icon: <LoadingIcon />,
						},
					} as Record<
						TokenState,
						{ label: string; icon: React.ReactNode }
					> ).map( ( [ state, { label, icon } ] ) => (
						<PanelRow key={ state }>
							<ToggleControl
								__nextHasNoMarginBottom
								label={
									<>
										{ icon }
										{ label }
									</>
								}
								checked={ customerDataTokenShouldBe.includes(
									state as TokenState
								) }
								onChange={ ( value ) => {
									if ( value ) {
										setAttributes( {
											customerDataTokenShouldBe: [
												...new Set( [
													...customerDataTokenShouldBe,
													state as TokenState,
												] ),
											],
											className: addClassName(
												className,
												`customer-data-token-visibility-${ state }`
											),
										} );
									} else {
										setAttributes( {
											customerDataTokenShouldBe:
												customerDataTokenShouldBe.filter(
													( v ) =>
														v !==
														( state as TokenState )
												),
											className: removeClassName(
												className,
												`customer-data-token-visibility-${ state }`
											),
										} );
									}
								} }
							/>
						</PanelRow>
					) ) }
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export const withTokenShouldBeValidControls = createHigherOrderComponent(
	( BlockEdit ) =>
		( props: {
			isSelected: boolean;
			setAttributes: (
				attributes: Partial< Attributes & { className?: string } >
			) => void;
			attributes: Attributes & { className?: string };
		} ) => {
			const { setAttributes } = props;
			const { customerDataTokenShouldBe, className } = props.attributes;
			const removeVisibility = useCallback(
				( visibility: TokenState ) => {
					setAttributes( {
						customerDataTokenShouldBe: customerDataTokenShouldBe.filter(
							( v ) => v !== visibility
						),
						className: removeClassName(
							className,
							`customer-data-token-visibility-${ visibility }`
						),
					} );
				},
				[ setAttributes, customerDataTokenShouldBe, className ]
			);

			return (
				<>
					{ /*
						Use BlockSettingsMenuControls instead?
						https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#blocksettingsmenucontrols
					*/ }
					<BlockControls>
						<ToolbarGroup>
							{ Object.entries( {
								valid: {
									label: __(
										'Display if the token is valid',
										'customer-data'
									),
									icon: (
										<ValidIcon
											onClick={ () =>
												removeVisibility( 'valid' )
											}
										/>
									),
								},
								invalid: {
									label: __(
										'Display if the token is invalid',
										'customer-data'
									),
									icon: (
										<InvalidIcon
											onClick={ () =>
												removeVisibility( 'invalid' )
											}
										/>
									),
								},
								loading: {
									label: __(
										'Display if the token is loading',
										'customer-data'
									),
									icon: (
										<LoadingIcon
											onClick={ () =>
												removeVisibility( 'loading' )
											}
										/>
									),
								},
							} as Record<
								TokenState,
								{ label: string; icon: React.ReactNode }
							> )
								.filter( ( [ state ] ) =>
									customerDataTokenShouldBe.includes(
										state as TokenState
									)
								)
								.map( ( [ state, { label, icon } ] ) => (
									<ToolbarButton
										key={ state }
										icon={ icon as IconType }
										label={ label }
									/>
								) ) }
						</ToolbarGroup>
					</BlockControls>
					<BlockEdit key="original-edit" { ...props } />
					<Edit key="additional-edit" { ...props } />
				</>
			);
		},
	'withTokenShouldBeValidControls'
);

const ValidIcon = ( props: any ) => (
	<Icon
		icon="unlock"
		className="customer-data-token-visibility-icon is-valid"
		{ ...props }
	/>
);

const InvalidIcon = ( props: any ) => (
	<Icon
		icon="lock"
		className="customer-data-token-visibility-icon is-invalid"
		{ ...props }
	/>
);

const LoadingIcon = ( props: any ) => (
	<Icon
		icon={ pending }
		className="customer-data-token-visibility-icon is-loading"
		{ ...props }
	/>
);
