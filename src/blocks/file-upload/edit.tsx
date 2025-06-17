/**
 * File Upload Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block allows users to upload files.
 */

import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import {
	Dashicon,
	PanelBody,
	PanelRow,
	TextControl,
	FormTokenField,
	ToggleControl,
	RangeControl,
} from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { fileTypes } from './file-types';
import { cloudUpload } from '@wordpress/icons';
import { TokenItem } from '@wordpress/components/build-types/form-token-field/types';
import type { IconKey } from '@wordpress/components/build-types/dashicon/types';
import { useCallback, useEffect, useId, useMemo } from '@wordpress/element';
import warning from '@wordpress/warning';
import { usePageSpace } from '../../libs/js/post';
import { addClassName } from '../../libs/js/classname';

export interface Attributes {
	destination: string;
	accept: string[];
	nbFiles: number;
	linkStyle: boolean;
	pageSpace: string;
	extractArchive: boolean;
	label: string;
}

const fileTypesSuggestions = Object.keys( fileTypes );

export const Edit: React.FC< {
	attributes: Attributes;
	setAttributes: ( attributes: Partial< Attributes > ) => void;
} > = /* withColors( 'backgroundColor', { textColor: 'color' } )( */ ( {
	attributes,
	setAttributes,
}: {
	attributes: Attributes;
	setAttributes: ( attributes: Partial< Attributes > ) => void;
} ): JSX.Element => {
	const { destination, accept, nbFiles, linkStyle, extractArchive, label } =
		attributes;
	const blockProps = useBlockProps();

	if ( ! linkStyle ) {
		blockProps.className = addClassName(
			blockProps.className,
			'wp-element-button'
		);
	}

	const labelFallback = useMemo( () => {
		return defaultLabel( nbFiles );
	}, [ nbFiles ] );

	const pageSpace = usePageSpace();

	useEffect(
		() => setAttributes( { pageSpace } ),
		[ setAttributes, pageSpace ]
	);

	const tooltip = useMemo( () => {
		if ( '' === destination ) {
			switch ( nbFiles ) {
				case 0:
					return __( 'Unlimited uploads', 'vfs' );
				case 1:
					return __( 'Single upload', 'vfs' );
				default:
					return sprintf(
						// translators: %s is the number of files
						__( '%s uploads', 'vfs' ),
						nbFiles
					);
			}
		}

		switch ( nbFiles ) {
			case 0:
				return sprintf(
					// translators: %s is the destination
					__( 'Unlimited uploads to %s', 'vfs' ),
					destination
				);
			case 1:
				return sprintf(
					// translators: %s is the destination
					__( 'Single upload to %s', 'vfs' ),
					destination
				);
			default:
				return sprintf(
					// translators: %1$s is the number of files, %2$s is the destination
					__( '%1$s uploads to %2$s', 'vfs' ),
					nbFiles,
					destination
				);
		}
	}, [ nbFiles, destination ] );

	const handleNbFilesChange = destination.endsWith( '/' )
		? // eslint-disable-next-line react-hooks/rules-of-hooks
		  useCallback(
				( value?: number ) => {
					if ( isNaN( value ?? 0 ) ) {
						warning( 'Invalid number of files' );
						return;
					}

					if ( 1 === value ) {
						setAttributes( {
							nbFiles: 1,
							destination: destination.slice( 0, -1 ),
						} );
						return;
					}

					setAttributes( {
						nbFiles: Math.round( value ?? 0 ),
						destination,
					} );
				},
				[ destination, setAttributes ]
		  )
		: // eslint-disable-next-line react-hooks/rules-of-hooks
		  useCallback(
				( value?: number ) => {
					if ( isNaN( value ?? 0 ) ) {
						warning( 'Invalid number of files' );
						return;
					}

					setAttributes( {
						nbFiles: Math.round( value ?? 0 ),
						destination: destination + '/',
					} );
				},
				[ destination, setAttributes ]
		  );

	const listId = useId();

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'File upload settings', 'vfs' ) }
					icon={ cloudUpload }
				>
					<PanelRow>
						<RangeControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Number of files to upload', 'vfs' ) }
							value={ nbFiles }
							help={
								<>
									{ ' ' }
									{ __(
										'The number of files that can be uploaded.',
										'vfs'
									) }
									<br />
									<small>
										{ __( '0 means unlimited.', 'vfs' ) }
									</small>{ ' ' }
								</>
							}
							step={ 1 }
							min={ 0 }
							max={ Math.max( 50, nbFiles * 1.5 ) }
							onChange={ handleNbFilesChange }
							list={ listId }
						/>
						<datalist id={ listId }>
							<option value={ 0 } />
							<option value={ 1 } />
							<option value={ 2 } />
							<option value={ 10 } />
							<option value={ 50 } />
						</datalist>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Link style', 'vfs' ) }
							checked={ linkStyle }
							onChange={ ( value: boolean ) =>
								setAttributes( { linkStyle: value } )
							}
						/>
					</PanelRow>
					<PanelRow>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={
								nbFiles === 0
									? __( 'Destination directory', 'vfs' )
									: _n(
											'Destination File Name',
											'Destination directory',
											nbFiles,
											'vfs'
									  )
							}
							value={ destination }
							prefix={ pageSpace }
							onChange={ ( value: string ) =>
								setAttributes( { destination: value } )
							}
							onBlur={ (
								e: React.FocusEvent< HTMLInputElement >
							) => {
								if (
									1 === nbFiles &&
									e.target.value.endsWith( '/' )
								) {
									e.target.value = e.target.value.slice(
										0,
										-1
									);
								} else if (
									nbFiles > 1 &&
									! e.target.value.endsWith( '/' )
								) {
									e.target.value = e.target.value + '/';
								}
							} }
							help={ _n(
								'Enter the name of the file where the uploaded file will be saved.',
								'Enter the name of the directory where the uploaded files will be saved.',
								nbFiles,
								'vfs'
							) }
						/>
					</PanelRow>
					<PanelRow>
						<FormTokenField
							__next40pxDefaultSize
							value={ accept.map( ( type ) =>
								fileTypes[ type ]
									? { ...fileTypes[ type ], value: type }
									: {
											value: type,
											title: type,
									  }
							) }
							label={ __( 'Allowed file types', 'vfs' ) }
							placeholder="*"
							suggestions={ fileTypesSuggestions }
							onChange={ ( value: ( string | TokenItem )[] ) =>
								setAttributes( {
									accept: value.map( ( type ) =>
										'string' === typeof type
											? type
											: type.value
									),
								} )
							}
							__nextHasNoMarginBottom
							__experimentalRenderItem={ ( {
								item,
							}: {
								item: string;
							} ) => {
								const fileType = fileTypes[ item ];
								return (
									<div>
										<Dashicon
											icon={
												fileType
													? fileType.dashicon
													: ( 'media' as IconKey )
											}
										/>
										{ item }
									</div>
								);
							} }
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __(
								'Automatically extract archive',
								'vfs'
							) }
							checked={ extractArchive }
							onChange={ ( value: boolean ) =>
								setAttributes( { extractArchive: value } )
							}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
			<RichText
				{ ...blockProps }
				title={ tooltip }
				data-toggle="tooltip"
				tagName={ linkStyle ? 'a' : 'span' }
				value={ label }
				allowedFormats={ [ 'core/bold', 'core/italic' ] }
				onChange={ ( newLabel: string ) =>
					setAttributes( { label: newLabel } )
				}
				placeholder={ labelFallback }
			/>
		</>
	);
};

export const defaultLabel = ( nbFiles: number ) => {
	return 0 === nbFiles
		? __( 'Add files', 'vfs' )
		: _n( 'Select file', 'Select files', nbFiles, 'vfs' );
};
