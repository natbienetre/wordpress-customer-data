/**
 * File Upload Delete Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block provides a delete button for uploaded files.
 */

import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { addClassName } from '../../libs/js/classname';
import { Attributes } from './edit';

export const Save: React.FC< {
	attributes: Attributes;
} > = ( { attributes } ) => {
	const blockProps = useBlockProps.save();
	const { useIcon, linkStyle, confirmationDialog } = attributes;

	if ( ! linkStyle ) {
		blockProps.className = addClassName(
			blockProps.className,
			'wp-element-button'
		);
	}

	return (
		// eslint-disable-next-line jsx-a11y/anchor-is-valid
		<a
			{ ...blockProps }
			href="javascript:void(0)"
			data-wp-on--click="vfs::actions.delete"
			data-wp-bind--title="vfs::state.deleteTitle"
			data-wp-context={ JSON.stringify( {
				confirmationDialog,
			} ) }
			title={ __( 'Delete', 'vfs' ) }
		>
			<span { ...( useIcon ? { className: 'screen-reader-text' } : {} ) }>
				{ __( 'Delete', 'vfs' ) }
			</span>
			{ useIcon && <span className="dashicons dashicons-trash"></span> }
		</a>
	);
};
