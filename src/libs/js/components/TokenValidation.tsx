import { Flex, TextControl } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { TokenSummary } from './TokenSummary';
import type { VersionnedTokenData } from 'token';
import { Token } from '../token';
import { store as jwksStore } from '../jwks';
import apiFetch from '../wordpress/api-fetch';
import {
	createLocalJWKSet,
	decodeJwt,
	type FlattenedJWSInput,
	type JWSHeaderParameters,
} from 'jose';
import { verifyToken } from '../global-token';

import './TokenValidation.scss';

export const TokenInspection: React.FC< {
	focusOnMount?: boolean;
} > = ( { focusOnMount } ): JSX.Element => {
	const [ token, setToken ] = useState( '' );
	const [ tokenData, setTokenData ] =
		useState< Token< VersionnedTokenData > | null >( null );
	const [ errors, setErrors ] = useState< string[] | undefined >( undefined );

	const keys = useSelect(
		( select ) => select( jwksStore ).all( apiFetch ),
		[]
	);

	const localJWKSet = useCallback(
		() => createLocalJWKSet( keys ),
		[ keys ]
	);

	const jwkSet = useMemo( () => localJWKSet(), [ localJWKSet ] );

	return (
		<Flex direction="column" className="vfs-token-validation">
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				className="vfs-token-validation-input"
				value={ token }
				onChange={ ( value ) => {
					setToken( value );
					if ( value.length > 0 ) {
						const result = parseToken( value, null );
						setTokenData( result.token );
						setErrors( result.errors );

						getTokenData( value, jwkSet ).then(
							( { token: t, errors: e } ) => {
								setTokenData( t );
								setErrors( e );
							}
						);
					} else {
						setTokenData( null );
						setErrors( undefined );
					}
				} }
				label={ __( 'Token to inspect', 'vfs' ) }
				hideLabelFromVision={ true }
				autoFocus={ focusOnMount } // eslint-disable-line jsx-a11y/no-autofocus
				placeholder={ _x(
					'xxxxxheaderxxxxx.yyyyypayloadyyyyyy.zzzzzsignaturezzzzz',
					'Token placeholder',
					'vfs'
				) }
				help={ __( 'Enter the token to inspect.', 'vfs' ) }
			/>
			{ token.length > 0 && (
				<TokenSummary token={ tokenData } errors={ errors } />
			) }
			{ token.length === 0 && (
				<p> { __( 'Token details will appear here.', 'vfs' ) } </p>
			) }
		</Flex>
	);
};

const parseToken = ( token: string, verifyError: string | null ) => {
	try {
		return {
			token: new Token( decodeJwt< VersionnedTokenData >( token ) ),
			errors: verifyError ? [ verifyError ] : [],
		};
	} catch ( err ) {
		return {
			token: null,
			errors: [ verifyError, ( err as Error ).message ].filter(
				Boolean
			) as string[],
		};
	}
};

const getTokenData = (
	token: string,
	jwkSet: (
		protectedHeader?: JWSHeaderParameters,
		token?: FlattenedJWSInput
	) => Promise< CryptoKey >
): Promise< {
	token: Token< VersionnedTokenData > | null;
	errors: string[];
} > =>
	verifyToken( token, jwkSet )
		.then( ( result ) => {
			return {
				token: new Token( result.payload ),
				errors: [],
			};
		} )
		.catch( ( err ) => {
			switch ( err.code ) {
				case 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED':
					return parseToken(
						token,
						__( 'Untrusted token, did you delete the key?', 'vfs' )
					);
				case 'ERR_JWS_INVALID':
					return parseToken(
						token,
						__( 'Invalid token format', 'vfs' )
					);
			}
			return parseToken(
				token,
				sprintf(
					// translators: %s is the error code.
					__( 'Invalid token: code %s', 'vfs' ),
					err.code
				)
			);
		} );
