/**
 * File Upload Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block allows users to upload files.
 */

import { useBlockProps, RichText } from '@wordpress/block-editor';
import { escapeAttribute } from '@wordpress/escape-html';
import { Attributes, defaultLabel } from './edit';
import type { FileUploadContext } from '../type';
import { addClassName } from '../../libs/js/classname';

export const Save: React.FC< {
	attributes: Attributes;
} > = ( { attributes } ) => {
	const blockProps = useBlockProps.save();
	const {
		destination,
		accept,
		nbFiles,
		pageSpace,
		extractArchive,
		label,
		linkStyle,
	} = attributes;

	if ( ! linkStyle ) {
		blockProps.className = addClassName(
			blockProps.className,
			'wp-element-button'
		);
	}

	return (
		<>
			<RichText.Content
				{ ...blockProps }
				tagName="a"
				value={
					( label || defaultLabel( nbFiles ) ) +
					`<input
						type="file"
						data-wp-on-async--change="callbacks.upload"
						data-wp-bind--disabled="!state.canWrite"
						accept=${ escapeAttribute( accept.join( ',' ) ) }
						${ 1 === nbFiles ? '' : 'multiple' }
					/>`
				}
				data-wp-interactive="customer-data"
				data-wp-context={ JSON.stringify( {
					files: [],
					accept,
					nbFiles,
					pageSpace,
					destination,
					extractArchive,
				} as Partial< FileUploadContext > ) }
			/>
		</>
	);
};
