import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

export const metaKey = '_vfs_subpath';

export const getPageSpace = ( editor: {
	getEditedPostAttribute: ( attribute: string ) => Record< string, unknown >;
} ) => {
	const meta = editor.getEditedPostAttribute( 'meta' ) as {
		[ metaKey ]: string | undefined;
	};
	return meta[ metaKey ]!;
};

export const usePageSpace = (): string =>
	useSelect( ( select ) => getPageSpace( select( editorStore ) ), [] );
