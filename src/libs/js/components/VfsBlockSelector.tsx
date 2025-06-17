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

export const VfsBlockSelector: React.FC = ( { ...props } ) => {
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

	const isVfsBlock = useCallback(
		( block: BlockInstance ) =>
			[
				FileUploadBlockName,
				TokenInputBlockName,
				FileUploadFileInfoBlockName,
			].includes( block.name ) ||
			[ 'invalid', 'valid', 'loading' ].some( ( state ) =>
				block.attributes.vfsTokenShouldBe.includes(
					state as TokenState
				)
			),
		[]
	);

	const vfsBlocksCount = useMemo(
		() => blocks.filter( isVfsBlock ).length,
		[ blocks, isVfsBlock ]
	);

	const selectNextBlock = useCallback( () => {
		const nextBlockId =
			blocks.slice( selectedBlockIndex + 1 ).find( isVfsBlock )
				?.clientId ??
			blocks.slice( 0, selectedBlockIndex ).find( isVfsBlock )?.clientId;
		if ( nextBlockId ) {
			selectBlock( nextBlockId );
		}
	}, [ selectBlock, selectedBlockIndex, blocks, isVfsBlock ] );

	return (
		( 0 === vfsBlocksCount && (
			<Notice status="warning">
				{ __(
					'No VFS blocks found, please insert a VFS block',
					'vfs'
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
							vfsBlocksCount,
							'vfs'
						),
						vfsBlocksCount
					) }
				</FlexBlock>
				<FlexItem>
					<Button
						__next40pxDefaultSize
						onClick={ selectNextBlock }
						icon={ 'controls-forward' }
						title={ __( 'Select the next block', 'vfs' ) }
						iconPosition="right"
					/>
				</FlexItem>
			</Flex>
		)
	);
};
