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
					title={ __( 'File upload settings', 'vfs' ) }
					icon={ cloudUpload }
				>
					<PanelRow>
						<ToggleControl
							label={ __( 'Use Icon', 'vfs' ) }
							help={ __(
								'If checked, the button will display an icon.',
								'vfs'
							) }
							checked={ useIcon }
							onChange={ ( value ) =>
								setAttributes( { useIcon: value } )
							}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={ __( 'Link Style', 'vfs' ) }
							help={ __(
								'If checked, the button will be styled as a link.',
								'vfs'
							) }
							checked={ linkStyle }
							onChange={ ( value ) =>
								setAttributes( { linkStyle: value } )
							}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={ __( 'Confirmation Dialog', 'vfs' ) }
							help={ __(
								'If checked, the button will display a confirmation dialog.',
								'vfs'
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
					{ __( 'Delete', 'vfs' ) }
				</span>
				{ useIcon && (
					<span className="dashicons dashicons-trash"></span>
				) }
			</a>
		</>
	);
};
