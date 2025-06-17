/**
 * File Upload Download Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block provides a download button for uploaded files.
 */

import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { addClassName } from '../../libs/js/classname';
import { FileUploadDownloadAttributes } from './edit';

export const Save: React.FC< {
	attributes: FileUploadDownloadAttributes;
} > = ( { attributes } ) => {
	const blockProps = useBlockProps.save();
	const { useIcon } = attributes;

	if ( ! attributes.linkStyle ) {
		blockProps.className = addClassName(
			blockProps.className,
			'wp-element-button'
		);
	}

	return (
		// eslint-disable-next-line jsx-a11y/anchor-is-valid
		<a
			{ ...blockProps }
			rel="external"
			title={ __( 'Download the file', 'vfs' ) }
			referrerPolicy="strict-origin-when-cross-origin"
			data-wp-bind--href="vfs::state.downloadUrl"
			data-wp-bind--download="vfs::context.file.name"
			data-wp-bind--type="vfs::context.file.type"
			data-wp-bind--title="vfs::state.downloadTitle"
		>
			<span { ...( useIcon ? { className: 'screen-reader-text' } : {} ) }>
				{ __( 'Download', 'vfs' ) }
			</span>
			{ useIcon && (
				<span className="dashicons dashicons-download"></span>
			) }
		</a>
	);
};
