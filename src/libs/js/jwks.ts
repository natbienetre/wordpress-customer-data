import { createReduxStore, register } from '@wordpress/data';
import { type JSONWebKeySet, type JWK } from 'jose';
import type ApiFetch from 'wordpress/api-fetch';

type RefreshAction = {
	type: 'JWKS_REFRESH';
	keys: JSONWebKeySet;
};

type DeleteAction = {
	type: 'JWKS_DELETE';
	key: string;
};

type AddAction = {
	type: 'JWKS_ADD';
	key: JWK;
};

type Action = RefreshAction | DeleteAction | AddAction;

type State = {
	dispatch: ( action: Action ) => void;
	select: {
		all: () => JSONWebKeySet;
	};
};

export const store = createReduxStore( 'vfs/jwks', {
	initialState: { keys: [] } as JSONWebKeySet,
	reducer: ( state: JSONWebKeySet, action: Action ): JSONWebKeySet => {
		switch ( action.type ) {
			case 'JWKS_REFRESH':
				return action.keys;
			case 'JWKS_DELETE':
				return {
					keys: state.keys.filter(
						( jwk: JWK ) => jwk.x !== action.key
					),
				};
			case 'JWKS_ADD':
				return { keys: [ ...state.keys, action.key ] };
			default:
				return state;
		}
	},
	resolvers: {
		all:
			( apiFetch: ApiFetch< JSONWebKeySet > ) => async ( state: State ) =>
				await apiFetch( { path: '/vfs/v1/jwks' } ).then( ( keys ) =>
					state.dispatch( { type: 'JWKS_REFRESH', keys } )
				),
	},
	selectors: {
		all: ( keys: JSONWebKeySet, _: ApiFetch< JSONWebKeySet > ) => keys, // eslint-disable-line @typescript-eslint/no-unused-vars
	},
	actions: {
		delete:
			( apiFetch: ApiFetch< JSONWebKeySet >, key: string ) =>
			async ( state: State ) =>
				apiFetch( {
					path: '/vfs/v1/jwks/' + encodeURIComponent( key ),
					method: 'DELETE',
				} ).then( () =>
					state.dispatch( { type: 'JWKS_DELETE', key } )
				),
		generate: ( apiFetch: ApiFetch< JWK > ) => async ( state: State ) =>
			apiFetch( {
				path: '/vfs/v1/jwks',
				method: 'POST',
			} ).then( ( key ) => state.dispatch( { type: 'JWKS_ADD', key } ) ),
		refresh:
			( apiFetch: ApiFetch< JSONWebKeySet > ) => async ( state: State ) =>
				apiFetch( { path: '/vfs/v1/jwks' } ).then( ( keys ) =>
					state.dispatch( { type: 'JWKS_REFRESH', keys } )
				),
	},
} );

register( store );
