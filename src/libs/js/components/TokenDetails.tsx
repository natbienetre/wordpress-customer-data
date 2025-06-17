import { Flex, FlexItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Token, allMethods } from '../token';
import type { TokenV1, VersionnedTokenData } from 'token';
import warning from '@wordpress/warning';
import type { FlexProps } from '@wordpress/components/build-types/flex/types';

import './TokenDetails.scss';

export const TokenDetails = ( {
	token,
}: {
	token: Token< VersionnedTokenData > | null;
} ) => {
	switch ( token?.data.version ) {
		case '1':
			return <TokenV1Details token={ token } />;
		default:
			warning( `Token version ${ token?.data.version } not supported` );
			return null;
	}
};

const TokenV1Details = ( {
	token,
	className,
	...props
}: {
	token: Token< TokenV1 > | null;
	className?: string;
} & Omit< FlexProps, 'direction' | 'children' > ) => {
	return (
		<Flex
			direction="column"
			className={ `vfs-token-details ${ className ?? '' }` }
			{ ...props }
		>
			{ ( null !== token && (
				<>
					{ token?.data.version && (
						<FlexItem className="vfs-token-details-row">
							<Flex direction="row">
								<FlexItem
									className={ `vfs-token-details-row-key vfs-token-details-row-key-version` }
								>
									{ __( 'Version', 'vfs' ) }
								</FlexItem>
								<FlexItem
									className={ `vfs-token-details-row-value vfs-token-details-row-value-version` }
								>
									{ token?.data.version }
								</FlexItem>
							</Flex>
						</FlexItem>
					) }
					{ token?.data.user.id && (
						<FlexItem className="vfs-token-details-row">
							<Flex direction="row">
								<FlexItem
									className={ `vfs-token-details-row-key vfs-token-details-row-key-user-id` }
								>
									{ __( 'User ID', 'vfs' ) }
								</FlexItem>
								<FlexItem
									className={ `vfs-token-details-row-value vfs-token-details-row-value-user-id` }
								>
									{ token?.data.user.id }
								</FlexItem>
							</Flex>
						</FlexItem>
					) }
					{ Object.entries( token?.data.user )
						.filter( ( [ k, v ] ) => k !== 'id' && v )
						.map( ( [ k, v ] ) => (
							<FlexItem
								key={ `${ k }-key` }
								className="vfs-token-details-row"
							>
								<Flex direction="row">
									<FlexItem
										key={ `${ k }-key` }
										className={ `vfs-token-details-row-key vfs-token-details-row-key-user-${ k.toLowerCase() }` }
										title={ k }
									>
										{ k }
									</FlexItem>
									<FlexItem
										key={ `${ k }-value` }
										className={ `vfs-token-details-row-value vfs-token-details-row-value-user-${ k.toLowerCase() }` }
										title={ v.toString() }
									>
										{ v.toString() }
									</FlexItem>
								</Flex>
							</FlexItem>
						) ) }
					{ token?.data.swift.pageSpace && (
						<FlexItem className="vfs-token-details-row">
							<Flex direction="row">
								<FlexItem
									className={ `vfs-token-details-row-key vfs-token-details-row-key-page-space` }
								>
									{ __( 'Page space', 'vfs' ) }
								</FlexItem>
								<FlexItem
									className={ `vfs-token-details-row-value vfs-token-details-row-value-page-space` }
								>
									{ token?.data.swift.pageSpace }
								</FlexItem>
							</Flex>
						</FlexItem>
					) }
					{ token?.data.swift.expiresAt && (
						<FlexItem className="vfs-token-details-row">
							<Flex direction="row">
								<FlexItem
									className={ `vfs-token-details-row-key vfs-token-details-row-key-expires-at` }
								>
									{ __( 'Expires at', 'vfs' ) }
								</FlexItem>
								<FlexItem
									className={ `vfs-token-details-row-value vfs-token-details-row-value-expires-at` }
								>
									{ new Date(
										token?.data.swift.expiresAt * 1000
									).toLocaleString() }
								</FlexItem>
							</Flex>
						</FlexItem>
					) }
					{ token?.data.swift.signatures && (
						<FlexItem className="vfs-token-details-row">
							<Flex direction="row">
								<FlexItem
									className={ `vfs-token-details-row-key vfs-token-details-row-key-signatures` }
								>
									{ __( 'Signatures', 'vfs' ) }
								</FlexItem>
								{ allMethods.map( ( method ) => (
									<FlexItem
										key={ method }
										className={ `vfs-token-details-row-value vfs-token-details-row-value-signatures ${
											method in
											( token?.data.swift.signatures ??
												{} )
												? 'vfs-token-validation-granted-method'
												: 'vfs-token-validation-denied-method'
										}` }
									>
										{ method }
									</FlexItem>
								) ) }
							</Flex>
						</FlexItem>
					) }
				</>
			) ) || <progress className="vfs-token-validation-progress" /> }
		</Flex>
	);
};
