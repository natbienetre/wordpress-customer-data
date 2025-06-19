import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelRow, PanelBody, TextControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { cloudUpload } from '@wordpress/icons';
import { name as FileUploadDate } from '../file-upload-date/block.json';
import { name as FileUploadDelete } from '../file-upload-delete/block.json';
import { name as FileUploadPreview } from '../file-upload-preview/block.json';
import { name as FileUploadFilename } from '../file-upload-filename/block.json';
import { FileUploadFilenameAttributes } from '../file-upload-filename/edit';
import { FileUploadPreviewAttributes } from '../file-upload-preview/edit';
import { usePageSpace } from '../../libs/js/post';

export type Attributes = {
	destination: string;
	pageSpace: string;
};

export const Edit: React.FC< {
	attributes: Attributes;
	setAttributes: ( attributes: Partial< Attributes > ) => void;
} > = ( { attributes, setAttributes } ) => {
	const blockProps = useBlockProps();
	const { destination } = attributes;

	// TODO use entity provider: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/#meta-source-deprecated
	const pageSpace = usePageSpace();

	useEffect( () => {
		setAttributes( { pageSpace } );
	}, [ setAttributes, pageSpace ] );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'File upload settings', 'customer-data' ) }
					icon={ cloudUpload }
				>
					<PanelRow>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Destination', 'customer-data' ) }
							value={ destination }
							prefix={ pageSpace }
							onChange={ ( value: string ) =>
								setAttributes( { destination: value } )
							}
							help={ __(
								'Enter the name where the file(s) are saved.',
								'customer-data'
							) }
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<InnerBlocks
					prioritizedInserterBlocks={ [
						FileUploadFilename,
						FileUploadDelete,
						FileUploadDate,
						'core/spacer',
					] }
					template={ [
						[
							FileUploadPreview,
							{
								previewImages: false,
							} as Partial< FileUploadPreviewAttributes >,
						],
						[
							FileUploadFilename,
							{
								style: {
									layout: {
										selfStretch: 'fill',
									},
								},
							} as Partial< FileUploadFilenameAttributes >,
						],
						[ FileUploadDelete ],
					] }
				/>
			</div>
		</>
	);
};
