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
			className={ `customer-data-token-details ${ className ?? '' }` }
			{ ...props }
		>
			{ ( null !== token && (
				<>
					{ token?.data.version && (
						<FlexItem className="customer-data-token-details-row">
							<Flex direction="row">
								<FlexItem
									className={ `customer-data-token-details-row-key customer-data-token-details-row-key-version` }
								>
									{ __( 'Version', 'customer-data' ) }
								</FlexItem>
								<FlexItem
									className={ `customer-data-token-details-row-value customer-data-token-details-row-value-version` }
								>
									{ token?.data.version }
								</FlexItem>
							</Flex>
						</FlexItem>
					) }
					{ token?.data.user.id && (
						<FlexItem className="customer-data-token-details-row">
							<Flex direction="row">
								<FlexItem
									className={ `customer-data-token-details-row-key customer-data-token-details-row-key-user-id` }
								>
									{ __( 'User ID', 'customer-data' ) }
								</FlexItem>
								<FlexItem
									className={ `customer-data-token-details-row-value customer-data-token-details-row-value-user-id` }
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
								className="customer-data-token-details-row"
							>
								<Flex direction="row">
									<FlexItem
										key={ `${ k }-key` }
										className={ `customer-data-token-details-row-key customer-data-token-details-row-key-user-${ k.toLowerCase() }` }
										title={ k }
									>
										{ k }
									</FlexItem>
									<FlexItem
										key={ `${ k }-value` }
										className={ `customer-data-token-details-row-value customer-data-token-details-row-value-user-${ k.toLowerCase() }` }
										title={ v.toString() }
									>
										{ v.toString() }
									</FlexItem>
								</Flex>
							</FlexItem>
						) ) }
					{ token?.data.swift.pageSpace && (
						<FlexItem className="customer-data-token-details-row">
							<Flex direction="row">
								<FlexItem
									className={ `customer-data-token-details-row-key customer-data-token-details-row-key-page-space` }
								>
									{ __( 'Page space', 'customer-data' ) }
								</FlexItem>
								<FlexItem
									className={ `customer-data-token-details-row-value customer-data-token-details-row-value-page-space` }
								>
									{ token?.data.swift.pageSpace }
								</FlexItem>
							</Flex>
						</FlexItem>
					) }
					{ token?.data.swift.expiresAt && (
						<FlexItem className="customer-data-token-details-row">
							<Flex direction="row">
								<FlexItem
									className={ `customer-data-token-details-row-key customer-data-token-details-row-key-expires-at` }
								>
									{ __( 'Expires at', 'customer-data' ) }
								</FlexItem>
								<FlexItem
									className={ `customer-data-token-details-row-value customer-data-token-details-row-value-expires-at` }
								>
									{ new Date(
										token?.data.swift.expiresAt * 1000
									).toLocaleString() }
								</FlexItem>
							</Flex>
						</FlexItem>
					) }
					{ token?.data.swift.signatures && (
						<FlexItem className="customer-data-token-details-row">
							<Flex direction="row">
								<FlexItem
									className={ `customer-data-token-details-row-key customer-data-token-details-row-key-signatures` }
								>
									{ __( 'Signatures', 'customer-data' ) }
								</FlexItem>
								{ allMethods.map( ( method ) => (
									<FlexItem
										key={ method }
										className={ `customer-data-token-details-row-value customer-data-token-details-row-value-signatures ${
											method in
											( token?.data.swift.signatures ??
												{} )
												? 'customer-data-token-validation-granted-method'
												: 'customer-data-token-validation-denied-method'
										}` }
									>
										{ method }
									</FlexItem>
								) ) }
							</Flex>
						</FlexItem>
					) }
				</>
			) ) || <progress className="customer-data-token-validation-progress" /> }
		</Flex>
	);
};
