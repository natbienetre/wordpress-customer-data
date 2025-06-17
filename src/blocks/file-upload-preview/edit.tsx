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
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { __, _n } from '@wordpress/i18n';
import type { Attachment } from '@wordpress/core-data';
import { cloudUpload, media } from '@wordpress/icons';
import { addClassName } from '../../libs/js/classname';

import noImage from './no-image.png';

export interface FileUploadPreviewAttributes {
	previewImages: boolean;
}

interface BlockContext {
	nbFiles: number;
}

export const Edit: React.FC< {
	attributes: FileUploadPreviewAttributes;
	setAttributes: (
		attributes: Partial< FileUploadPreviewAttributes >
	) => void;
	context: Partial< BlockContext >;
} > = ( { attributes, setAttributes, context } ) => {
	const { previewImages } = attributes;
	const blockProps = useBlockProps();

	blockProps.className = addClassName( blockProps.className, 'dashicons' );

	const featuredImage = useSelect( ( select ) => {
		const featuredImageId =
			select( editorStore ).getEditedPostAttribute( 'featured_media' );
		const image = select( coreStore ).getEntityRecord(
			'postType',
			'attachment',
			featuredImageId
		) as Attachment;
		return image ? image.source_url : noImage;
	}, [] );

	const { nbFiles } = context;

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ _n(
						'File upload settings',
						'Files upload settings',
						nbFiles ?? 0,
						'vfs'
					) }
					icon={ cloudUpload }
				>
					<PanelRow>
						<ToggleControl
							label={ _n(
								'Use image preview (if possible)',
								'Use image previews (if possible)',
								nbFiles ?? 0,
								'vfs'
							) }
							checked={ previewImages }
							onChange={ ( value ) =>
								setAttributes( { previewImages: value } )
							}
							__nextHasNoMarginBottom
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			{ previewImages ? (
				<img
					{ ...blockProps }
					src={ featuredImage }
					alt={ __( 'Image preview', 'vfs' ) }
				/>
			) : (
				<span
					{ ...blockProps }
					title={ __( 'image/preview', 'vfs' ) }
					data-toggle="tooltip"
				>
					{ media }
				</span>
			) }
		</>
	);
};
