/**
 * File Upload Delete Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block provides a delete button for uploaded files.
 */

import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, PanelRow, ToggleControl } from '@wordpress/components';
import { cloudUpload } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { addClassName } from '../../libs/js/classname';

export interface Attributes {
	useIcon: boolean;
	linkStyle: boolean;
	confirmationDialog: boolean;
}

export const Edit: React.FC< {
	attributes: Attributes;
	setAttributes: ( attributes: Partial< Attributes > ) => void;
} > = ( { attributes, setAttributes } ) => {
	const { useIcon, linkStyle, confirmationDialog } = attributes;
	const blockProps = useBlockProps();

	if ( ! linkStyle ) {
		blockProps.className = addClassName(
			blockProps.className,
			'wp-element-button'
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'File upload settings', 'customer-data' ) }
					icon={ cloudUpload }
				>
					<PanelRow>
						<ToggleControl
							label={ __( 'Use Icon', 'customer-data' ) }
							help={ __(
								'If checked, the button will display an icon.',
								'customer-data'
							) }
							checked={ useIcon }
							onChange={ ( value ) =>
								setAttributes( { useIcon: value } )
							}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={ __( 'Link Style', 'customer-data' ) }
							help={ __(
								'If checked, the button will be styled as a link.',
								'customer-data'
							) }
							checked={ linkStyle }
							onChange={ ( value ) =>
								setAttributes( { linkStyle: value } )
							}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={ __( 'Confirmation Dialog', 'customer-data' ) }
							help={ __(
								'If checked, the button will display a confirmation dialog.',
								'customer-data'
							) }
							checked={ confirmationDialog }
							onChange={ ( value ) =>
								setAttributes( { confirmationDialog: value } )
							}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
			<a { ...blockProps }>
				<span className={ useIcon ? 'screen-reader-text' : '' }>
					{ __( 'Delete', 'customer-data' ) }
				</span>
				{ useIcon && (
					<span className="dashicons dashicons-trash"></span>
				) }
			</a>
		</>
	);
};
