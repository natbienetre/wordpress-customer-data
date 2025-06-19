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
import { FileUploadFilenameAttributes } from './edit';
import { __ } from '@wordpress/i18n';

export const Save: React.FC< {
	attributes: FileUploadFilenameAttributes;
} > = ( { attributes } ) => {
	const blockProps = useBlockProps.save();
	const { showExtension, linkToDownload } = attributes;

	return (
		<Container { ...blockProps } linkToDownload={ linkToDownload }>
			<span
				data-wp-text={
					showExtension
						? `customer-data::context.file.name`
						: `customer-data::state.getBasename`
				}
			/>

			<progress
				data-wp-bind--value="customer-data::context.file.uploaded"
				data-wp-bind--max="customer-data::context.file.size"
			/>
		</Container>
	);
};

const Container: React.FC<
	{
		linkToDownload: boolean;
	} & { children: React.ReactNode }
> = ( { linkToDownload, children, ...blockProps } ) => {
	return (
		( linkToDownload && (
			// eslint-disable-next-line jsx-a11y/anchor-is-valid
			<a
				{ ...blockProps }
				rel="external"
				title={ __( 'Download the file', 'customer-data' ) }
				referrerPolicy="strict-origin-when-cross-origin"
				data-wp-bind--href="customer-data::state.downloadUrl"
				data-wp-bind--download="customer-data::context.file.name"
				data-wp-bind--type="customer-data::context.file.type"
				data-wp-bind--title="customer-data::state.downloadTitle"
			>
				{ children }
			</a>
		) ) || <div { ...blockProps }>{ children }</div>
	);
};
