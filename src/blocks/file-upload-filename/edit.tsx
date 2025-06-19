/**
 * File Upload Info Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block displays information about uploaded files.
 */

import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, PanelRow, ToggleControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/url';
import { store as editorStore } from '@wordpress/editor';
import { cloudUpload } from '@wordpress/icons';
import { forwardRef } from '@wordpress/element';

export interface FileUploadFilenameAttributes {
	showExtension: boolean;
	fontSize: string;
	linkToDownload: boolean;
	style: {
		layout: {
			selfStretch: string;
		};
	};
}

export const Edit: React.FC< {
	attributes: FileUploadFilenameAttributes;
	setAttributes: (
		attributes: Partial< FileUploadFilenameAttributes >
	) => void;
} > = ( { attributes, setAttributes } ) => {
	const blockProps = useBlockProps();
	const { showExtension, linkToDownload } = attributes;

	const filename = useSelect(
		( select ) => {
			const title =
				select( editorStore ).getEditedPostAttribute( 'title' );

			if ( showExtension ) {
				if ( title ) {
					return cleanForSlug( title ) + '.png';
				}

				return _x( 'filename.png', 'Default file name', 'customer-data' );
			}
			if ( title ) {
				return cleanForSlug( title );
			}

			return _x(
				'filename',
				'Default file name without extension',
				'customer-data'
			);
		},
		[ showExtension ]
	);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ _x(
						'File upload settings',
						'File upload filename block',
						'customer-data'
					) }
					icon={ cloudUpload }
				>
					<PanelRow>
						<ToggleControl
							label={ __( 'Show file(s) extension', 'customer-data' ) }
							checked={ showExtension }
							onChange={ ( value: boolean ) =>
								setAttributes( { showExtension: value } )
							}
							__nextHasNoMarginBottom
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Link to download the file', 'customer-data' ) }
							checked={ linkToDownload }
							help={ __(
								'If enabled, the name of the file will be a link to download the file.',
								'customer-data'
							) }
							onChange={ ( value: boolean ) =>
								setAttributes( { linkToDownload: value } )
							}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<EditContainer { ...blockProps } linkToDownload={ linkToDownload }>
				<span>{ filename }</span>
			</EditContainer>
		</>
	);
};

const EditContainer = forwardRef<
	any,
	{
		linkToDownload: boolean;
	} & { children: React.ReactNode }
>( ( { linkToDownload, children, ...blockProps }, ref ) => {
	return (
		( linkToDownload && (
			// eslint-disable-next-line jsx-a11y/anchor-is-valid
			<a { ...blockProps } ref={ ref }>
				{ children }
			</a>
		) ) || (
			<div ref={ ref } { ...blockProps }>
				{ children }
			</div>
		)
	);
} );
