import { store as preferencesStore } from '@wordpress/preferences';
import { useDispatch, useSelect } from '@wordpress/data';

export const scope = 'vfs/editor';
export const visibilityHelperName = 'blockVisibilityHelper';

// TODO, use preference store or feature in core-editor?
// https://developer.wordpress.org/block-editor/reference-guides/data/data-core-edit-post/#isfeatureactive
// https://developer.wordpress.org/block-editor/reference-guides/data/data-core-edit-post/#togglefeature

export const useSelectVisibilityHelperPreference = () =>
	useSelect(
		( select ) =>
			select( preferencesStore ).get( scope, visibilityHelperName ) ??
			false,
		[]
	);

export const useDispatchVisibilityHelperPreference = () => {
	const store = useDispatch( preferencesStore );
	return ( value: boolean ) => {
		store.set( scope, visibilityHelperName, value );
	};
};
