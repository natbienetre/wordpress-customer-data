import { Flex, Notice, NoticeList } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Token } from '../token';
import type { VersionnedTokenData } from 'token';
import { TokenDetails } from './TokenDetails';

export const TokenSummary = ( {
	token,
	errors,
}: {
	token: Token< VersionnedTokenData > | null;
	errors: string[] | undefined;
} ) => {
	return (
		<Flex direction="column">
			{ undefined === errors
				? ( token && (
						<Notice isDismissible={ false }>
							{ __( 'Validating token…', 'vfs' ) }
							<progress />
						</Notice>
				  ) ) ||
				  null
				: errors?.length > 0 && (
						<NoticeList
							className={ `vfs-token-validation-result ${
								errors!.length > 0
									? 'vfs-token-validation-result-error'
									: 'vfs-token-validation-result-success'
							}` }
							notices={ errors!.map( ( error, index ) => ( {
								id: index.toString(),
								content: error,
								status: 'error',
								isDismissible: false,
							} ) ) }
						/>
				  ) }
			{ token && <TokenDetails token={ token } /> }
		</Flex>
	);
};
