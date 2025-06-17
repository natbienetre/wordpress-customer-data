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
						? `vfs::context.file.name`
						: `vfs::state.getBasename`
				}
			/>

			<progress
				data-wp-bind--value="vfs::context.file.uploaded"
				data-wp-bind--max="vfs::context.file.size"
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
				title={ __( 'Download the file', 'vfs' ) }
				referrerPolicy="strict-origin-when-cross-origin"
				data-wp-bind--href="vfs::state.downloadUrl"
				data-wp-bind--download="vfs::context.file.name"
				data-wp-bind--type="vfs::context.file.type"
				data-wp-bind--title="vfs::state.downloadTitle"
			>
				{ children }
			</a>
		) ) || <div { ...blockProps }>{ children }</div>
	);
};
