/**
 * Editor Sidebar Component
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This component provides a UI for generating temporary URLs in the WordPress editor sidebar.
 */

import type React from 'react';
import { __, sprintf, _n } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	Button,
	Flex,
	FlexBlock,
	FlexItem,
	Notice,
} from '@wordpress/components';
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { name as FileUploadBlockName } from '../../../blocks/file-upload/block.json';
import { name as TokenInputBlockName } from '../../../blocks/token-input/block.json';
import { name as FileUploadFileInfoBlockName } from '../../../blocks/file-upload-fileinfo/block.json';

import './EditorSidebar.scss';
import type { BlockInstance } from '@wordpress/blocks';
import { TokenState } from '../../../blocks/type';

export const CustomerDataBlockSelector: React.FC = ( { ...props } ) => {
	const blocks = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore ) as {
			getBlocks: ( rootClientId?: string ) => BlockInstance[];
		};

		const build = ( block: BlockInstance ): BlockInstance[] => [
			block,
			...getBlocks( block.clientId ).flatMap( build ),
		];

		return getBlocks().flatMap( build );
	}, [] );

	const selectedBlockIndex = useSelect(
		( select ) => {
			const blockEditor = select( blockEditorStore ) as {
				getSelectedBlock: () => {
					clientId: string;
				} | null;
				getBlockIndex: ( clientId: string ) => number;
			};
			return blocks.findIndex(
				( b ) => b.clientId === blockEditor.getSelectedBlock()?.clientId
			);
		},
		[ blocks ]
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	const isCustomerDataBlock = useCallback(
		( block: BlockInstance ) =>
			[
				FileUploadBlockName,
				TokenInputBlockName,
				FileUploadFileInfoBlockName,
			].includes( block.name ) ||
			[ 'invalid', 'valid', 'loading' ].some( ( state ) =>
				block.attributes.customerDataTokenShouldBe.includes(
					state as TokenState
				)
			),
		[]
	);

	const customerDataBlocksCount = useMemo(
		() => blocks.filter( isCustomerDataBlock ).length,
		[ blocks, isCustomerDataBlock ]
	);

	const selectNextBlock = useCallback( () => {
		const nextBlockId =
			blocks.slice( selectedBlockIndex + 1 ).find( isCustomerDataBlock )
				?.clientId ??
			blocks.slice( 0, selectedBlockIndex ).find( isCustomerDataBlock )?.clientId;
		if ( nextBlockId ) {
			selectBlock( nextBlockId );
		}
	}, [ selectBlock, selectedBlockIndex, blocks, isCustomerDataBlock ] );

	return (
		( 0 === customerDataBlocksCount && (
			<Notice status="warning">
				{ __(
					'No CustomerData blocks found, please insert a CustomerData block',
					'customer-data'
				) }
			</Notice>
		) ) || (
			<Flex { ...props }>
				<FlexBlock>
					{ sprintf(
						// translators: %d is the number of blocks
						_n(
							'%d block found',
							'%d blocks found',
							customerDataBlocksCount,
							'customer-data'
						),
						customerDataBlocksCount
					) }
				</FlexBlock>
				<FlexItem>
					<Button
						__next40pxDefaultSize
						onClick={ selectNextBlock }
						icon={ 'controls-forward' }
						title={ __( 'Select the next block', 'customer-data' ) }
						iconPosition="right"
					/>
				</FlexItem>
			</Flex>
		)
	);
};
