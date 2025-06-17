/**
 * Editor Sidebar Component
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This component provides a UI for generating temporary URLs in the WordPress editor sidebar.
 */

import type React from 'react';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '@wordpress/editor';
import { TextControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

import './EditorSidebar.scss';
import { metaKey, usePageSpace } from '../post';

export const UploadDestinationSelector: React.FC = () => {
	const pageSpace = usePageSpace();

	const { editPost } = useDispatch( editorStore );

	const onChange = useCallback(
		( value: string ) => {
			editPost( {
				meta: {
					[ metaKey ]: value,
				},
			} );
		},
		[ editPost ]
	);

	return (
		<TextControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Upload destination folder', 'vfs' ) }
			value={ pageSpace }
			onChange={ onChange }
			placeholder={ __( 'Enter destination', 'vfs' ) }
		/>
	);
};
