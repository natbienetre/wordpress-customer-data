/**
 * File Upload Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block allows users to upload files.
 */

import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	PanelRow,
	TextControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cloudUpload } from '@wordpress/icons';

export interface Attributes {
	placeholder: string;
	autopopulate: boolean;
	type: 'text' | 'password';
}

export const Edit: React.FC< {
	attributes: Attributes;
	setAttributes: ( attributes: Partial< Attributes > ) => void;
} > = ( { attributes, setAttributes } ): JSX.Element => {
	const blockProps = useBlockProps();
	const { placeholder, autopopulate, type } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Token input settings', 'customer-data' ) }
					icon={ cloudUpload }
				>
					<PanelRow>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Placeholder', 'customer-data' ) }
							type="text"
							value={ placeholder }
							help={ __(
								'The placeholder text for the input.',
								'customer-data'
							) }
							onChange={ ( value: string ) => {
								setAttributes( { placeholder: value } );
							} }
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Autopopulate', 'customer-data' ) }
							checked={ autopopulate }
							onChange={ ( value: boolean ) => {
								setAttributes( { autopopulate: value } );
							} }
						/>
					</PanelRow>
					<PanelRow>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Type', 'customer-data' ) }
							value={ type ?? 'text' }
							options={ [
								{ value: 'text', label: __( 'Text', 'customer-data' ) },
								{
									value: 'password',
									label: __( 'Password', 'customer-data' ),
								},
							] }
							onChange={ ( value: 'text' | 'password' ) => {
								setAttributes( { type: value } );
							} }
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<input
				type={ type }
				value={ placeholder }
				placeholder={
					autopopulate
						? __( 'The token from the query', 'customer-data' )
						: undefined
				}
				onChange={ ( e: React.ChangeEvent< HTMLInputElement > ) => {
					setAttributes( { placeholder: e.target.value } );
				} }
				{ ...blockProps }
			/>
		</>
	);
};
