import { store, getElement } from '@wordpress/interactivity';
import type { TokenState, VfsState } from '../../blocks/type';

const { state } = store( 'vfs', {
	callbacks: {
		setVisilibity: async () => {
			const element = getElement().ref;

			if ( ! element ) {
				return;
			}

			const originalDisplay =
				element.dataset.vfsOriginalDisplay ?? 'initial';
			const tokenShouldBe = JSON.parse(
				element.dataset.vfsTokenShouldBe ?? '[]'
			) as TokenState[];

			if ( tokenShouldBe.length === 0 ) {
				element.style.display = originalDisplay;
			}

			if (
				tokenShouldBe.some( ( expected ) => state.tokenIs( expected ) )
			) {
				element.style.display = originalDisplay;
			} else {
				element.style.display = 'none';
			}
		},
	},
} ) as any as {
	state: VfsState;
};
