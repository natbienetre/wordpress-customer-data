/**
 * File Upload Download Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block provides a download button for uploaded files.
 */

import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, PanelRow, ToggleControl } from '@wordpress/components';
import { cloudDownload } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { addClassName } from '../../libs/js/classname';

export interface FileUploadDownloadAttributes {
	useIcon: boolean;
	linkStyle: boolean;
	javascriptDownload: boolean;
	style: {
		padding:
			| string
			| Partial< {
					top: string;
					bottom: string;
					left: string;
					right: string;
			  } >;
	};
}

export const Edit: React.FC< {
	attributes: FileUploadDownloadAttributes;
	setAttributes: (
		attributes: Partial< FileUploadDownloadAttributes >
	) => void;
} > = ( { attributes, setAttributes } ) => {
	const blockProps = useBlockProps();
	const { useIcon, javascriptDownload, linkStyle } = attributes;

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
					icon={ cloudDownload }
				>
					<PanelRow>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Use Icon', 'customer-data' ) }
							checked={ useIcon }
							help={ __(
								'If checked, the button will display an icon.',
								'customer-data'
							) }
							onChange={ ( value: boolean ) =>
								setAttributes( { useIcon: value } )
							}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={ __( 'Link Style', 'customer-data' ) }
							checked={ linkStyle }
							help={ __(
								'If checked, the button will be styled as a link.',
								'customer-data'
							) }
							onChange={ ( value: boolean ) =>
								setAttributes( { linkStyle: value } )
							}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Use JavaScript download', 'customer-data' ) }
							checked={ javascriptDownload }
							disabled={ true }
							onChange={ ( value: boolean ) =>
								setAttributes( {
									javascriptDownload: value,
								} )
							}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
			<a { ...blockProps }>
				<span className={ useIcon ? 'screen-reader-text' : '' }>
					{ __( 'Download', 'customer-data' ) }
				</span>
				{ useIcon && (
					<span className="dashicons dashicons-download"></span>
				) }
			</a>
		</>
	);
};
