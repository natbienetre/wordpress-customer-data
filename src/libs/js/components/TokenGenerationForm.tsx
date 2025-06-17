import type React from 'react';
import { __ } from '@wordpress/i18n';

import {
	Button,
	TextControl,
	Notice,
	Flex,
	FlexItem,
	FlexBlock,
	Navigator,
	ProgressBar,
} from '@wordpress/components';
import {
	useState,
	useEffect,
	useMemo,
	useCallback,
	RawHTML,
} from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import { copy } from '@wordpress/icons';
import { SwiftAdmin } from '../file-management';
import type { Element } from '@wordpress/element';
import type { UserDataV1 } from 'token';

export const TokenGenerationForm: React.FC< {
	swiftAdmin: SwiftAdmin;
	userDefaults?: Partial< UserDataV1 >;
	userConstraints?: Partial< UserDataV1 >;
	defaultSuffix?: string;
	suffixConstraints?: string;
} > = ( {
	swiftAdmin,
	defaultSuffix,
	suffixConstraints,
	userDefaults,
	userConstraints,
} ) => {
	const [ isGenerating, setIsGenerating ] = useState< boolean >( false );
	const [ result, setResult ] = useState< string | undefined >( undefined );
	const [ error, setError ] = useState< Element | undefined >( undefined );
	const [ generatedAt, setGeneratedAt ] = useState< Date >( new Date() );
	const [ user, setUser ] = useState< UserDataV1 >( {
		id: userConstraints?.id ?? userDefaults?.id ?? '',
		email: userConstraints?.email ?? userDefaults?.email ?? null,
		displayName:
			userConstraints?.displayName ?? userDefaults?.displayName ?? null,
	} );
	const [ suffix, setSuffix ] = useState< string >( defaultSuffix ?? '' );

	const setUserWithConstraints = useCallback(
		( newUser: Partial< UserDataV1 > ) => {
			setUser( {
				id: userConstraints?.id ?? newUser.id ?? user.id,
				email: userConstraints?.email ?? newUser.email ?? user.email,
				displayName:
					userConstraints?.displayName ??
					newUser.displayName ??
					user.displayName,
			} );
		},
		[ userConstraints, user ]
	);

	const expiresAt = useMemo( () => {
		return new Date( generatedAt.getTime() + 1000 * 60 * 60 * 24 * 365 ); // 1 year later
	}, [ generatedAt ] );

	useEffect( () => {
		const generateIn = generatedAt.getTime() + 1000 * 60 * 60; // 1 hour later
		const timeout = setTimeout(
			() => setGeneratedAt( new Date() ),
			generateIn
		);
		return () => clearTimeout( timeout );
	}, [ generatedAt ] );

	const userId = useMemo( () => {
		return (
			user.id ||
			user.email ||
			user.displayName!.replaceAll( ' ', '.' ).toLowerCase()
		);
	}, [ user ] );

	const generateUrl = useCallback( () => {
		if ( isGenerating ) {
			return;
		}

		let cancelled = false;

		setError( undefined );
		setResult( undefined );
		setIsGenerating( true );

		swiftAdmin
			.generateUserToken(
				{
					...user,
					id: userId,
				},
				encodeURIComponent( suffix ?? '' ),
				expiresAt
			)
			.then( ( token ) => {
				if ( cancelled ) {
					return;
				}

				return swiftAdmin.signToken( token, null );
			} )
			.then( ( signedToken: string | URL | undefined ) => {
				if ( cancelled ) {
					return;
				}

				setResult( signedToken!.toString() );
			} )
			.catch( ( err: Error ) => {
				setError(
					<>
						<div>{ __( 'Failed to generate token', 'vfs' ) }</div>
						<RawHTML>{ err.message }</RawHTML>
					</>
				);

				throw err;
			} )
			.finally( () => {
				setIsGenerating( false );
			} );

		return () => {
			cancelled = true;
		};
	}, [ swiftAdmin, user, userId, suffix, expiresAt, isGenerating ] );

	return (
		<Navigator initialPath="/">
			<Navigator.Screen path="/result">
				<Flex direction="column">
					<FlexBlock>
						<ResultScreen error={ error } result={ result } />
					</FlexBlock>
					<FlexItem>
						<Navigator.BackButton variant="secondary">
							{ __( 'Go back', 'vfs' ) }
						</Navigator.BackButton>
					</FlexItem>
				</Flex>
			</Navigator.Screen>
			<Navigator.Screen path="/">
				<Flex>
					<FlexBlock>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Scope', 'vfs' ) }
							value={ suffix }
							onChange={ ( value ) => {
								if ( ! suffixConstraints ) {
									setSuffix( value );
									return;
								}

								if ( value.startsWith( suffixConstraints ) ) {
									setSuffix( value );
									return;
								}

								setSuffix( suffixConstraints + value );
							} }
						/>
					</FlexBlock>
				</Flex>
				<Flex>
					<FlexItem>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Display name', 'vfs' ) }
							readOnly={
								userConstraints?.displayName !== undefined
							}
							value={ user.displayName ?? '' }
							onChange={ ( value ) =>
								setUserWithConstraints( {
									displayName: value,
								} )
							}
						/>
					</FlexItem>
				</Flex>
				<Flex>
					<FlexBlock>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Email', 'vfs' ) }
							readOnly={ userConstraints?.email !== undefined }
							value={ user.email ?? '' }
							type="email"
							onChange={ ( value ) =>
								setUserWithConstraints( { email: value } )
							}
						/>
					</FlexBlock>
				</Flex>
				<Flex align="flex-end">
					<FlexBlock>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Identifier', 'vfs' ) }
							readOnly={ userConstraints?.id !== undefined }
							placeholder={ userId }
							value={ user.id }
							onChange={ ( value ) =>
								setUserWithConstraints( { id: value } )
							}
						/>
					</FlexBlock>
					<FlexItem>
						<Navigator.Button
							__next40pxDefaultSize
							path="/result"
							variant="primary"
							onClick={ generateUrl }
						>
							{ __( 'Generate temporary token', 'vfs' ) }
						</Navigator.Button>
					</FlexItem>
				</Flex>
			</Navigator.Screen>
		</Navigator>
	);
};

const ResultScreen: React.FC< {
	error?: Element;
	result?: string;
} > = ( { error, result } ) => {
	const copyToClipboard = useCopyToClipboard( result ?? '', () => {} );

	return (
		<>
			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }
			{ ( result && (
				<Flex>
					<FlexBlock>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							hideLabelFromVision={ true }
							label={ __( 'Generated token', 'vfs' ) }
							value={ result }
							readOnly
							onChange={ () => {} }
						/>
					</FlexBlock>
					<FlexItem>
						<Button
							__next40pxDefaultSize
							ref={ copyToClipboard }
							icon={ copy }
							size="compact"
							label={ __( 'Copy to clipboard', 'vfs' ) }
						/>
					</FlexItem>
				</Flex>
			) ) || <ProgressBar /> }
		</>
	);
};
