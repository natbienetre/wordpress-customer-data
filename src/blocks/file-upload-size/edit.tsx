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
import { useSelect } from '@wordpress/data';
import { formatFileSize } from '../../libs/js/format';
import { store as editorStore } from '@wordpress/editor';

export const Edit: React.FC = () => {
	const blockProps = useBlockProps();

	const size = useSelect( ( select ) => {
		const postId = select( editorStore ).getEditedPostAttribute( 'id' );
		return postId ? postId * 1024 : 0;
	}, [] );

	return (
		<>
			<span { ...blockProps }>{ formatFileSize( size ) }</span>
		</>
	);
};
