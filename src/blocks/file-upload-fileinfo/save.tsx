/**
 * File Upload Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block allows users to upload files.
 */

import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import type { Attributes } from './edit';
import type { FileUploadContext } from '../type';

export const Save: React.FC< {
	attributes: Attributes;
} > = ( { attributes } ) => {
	const blockProps = useBlockProps.save();
	const { destination, pageSpace } = attributes;

	return (
		<>
			<div
				className="wp-block-customer-data-upload-fileinfo-container"
				data-wp-interactive="customer-data"
				data-wp-context={ JSON.stringify( {
					destination,
					pageSpace,
				} as Partial< FileUploadContext > ) }
			>
				<template
					data-wp-each--file="state.localFiles"
					data-wp-each-key="context.file.remotePath"
				>
					<div
						{ ...blockProps }
						data-wp-class--customer-data-upload-in-progress="context.file.status.inProgress"
						data-wp-class--customer-data-upload-error="context.file.status.error"
						data-wp-class--customer-data-upload-success="context.file.status.success"
					>
						<InnerBlocks.Content />
					</div>
				</template>
				<progress
					className="customer-data-upload-progress"
					data-wp-class--customer-data-upload-loaded="state.loaded"
					{ ...blockProps }
				/>
			</div>
		</>
	);
};
