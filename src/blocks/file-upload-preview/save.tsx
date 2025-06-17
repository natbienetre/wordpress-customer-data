/**
 * File Upload Info Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block displays information about uploaded files.
 */

import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { addClassName } from '../../libs/js/classname';

interface BlockAttributes {
	previewImages: boolean;
}

export const Save: React.FC< {
	attributes: BlockAttributes;
} > = ( { attributes } ) => {
	const blockProps = useBlockProps.save();
	const { previewImages } = attributes;

	blockProps.className = addClassName( blockProps.className, 'dashicons' );

	return (
		<div { ...blockProps }>
			{ ( previewImages && (
				<img
					className="preview success-preview"
					data-wp-bind--src="vfs::state.previewURL"
					data-wp-bind--alt="vfs::state.dashicon"
					data-wp-bind--title="vfs::context.file.type"
					alt={ __( 'Preview', 'vfs' ) }
				/>
			) ) || (
				<span
					className="preview success-preview"
					data-wp-text="vfs::state.dashicon"
					data-wp-bind--title="vfs::context.file.type"
					data-toggle="tooltip"
				/>
			) }
			<span
				className="dashicons dashicons-warning preview error-preview"
				title={ __( 'Error', 'vfs' ) }
			/>
			<span
				className="dashicons dashicons-update preview in-progress-preview"
				title={ __( 'In progress', 'vfs' ) }
			/>
		</div>
	);
};
