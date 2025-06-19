/**
 * File Upload Info Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block displays information about uploaded files.
 */

import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	Dashicon,
	PanelBody,
	PanelRow,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { dateI18n, getSettings, humanTimeDiff } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { forwardRef, useEffect, useMemo, useState } from '@wordpress/element';

export interface Attributes {
	relative: boolean;
}

export const Edit: React.FC< {
	attributes: Attributes;
	setAttributes: ( attributes: Partial< Attributes > ) => void;
} > = ( { attributes, setAttributes } ) => {
	const { relative } = attributes;
	const blockProps = useBlockProps();

	const baseDate = useSelect(
		( select ) =>
			new Date(
				select( editorStore ).getEditedPostAttribute( 'date_gmt' ) ??
					webpack.compilation.date
			),
		[]
	) as Date;

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'File upload date', 'customer-data' ) }
					icon={ <Dashicon icon="clock" /> }
				>
					<PanelRow>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Relative date', 'customer-data' ) }
							checked={ relative }
							help={ __(
								'Display the date relative to the current time',
								'customer-data'
							) }
							onChange={ ( value: boolean ) =>
								setAttributes( { relative: value } )
							}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<DateText
				relative={ relative }
				creationDate={ baseDate }
				{ ...blockProps }
			/>
		</>
	);
};

const refreshInterval = 5_000;

const DateText = forwardRef<
	HTMLSpanElement,
	{ relative: boolean; creationDate: Date }
>( ( { relative, creationDate, ...blockProps }, ref ) => {
	const [ currentDate, setCurrentDate ] = useState( new Date() );

	const dateSettings = useMemo( () => getSettings(), [] );

	const absoluteDate = useMemo( () => {
		return dateI18n(
			dateSettings.formats.datetimeAbbreviated,
			creationDate,
			dateSettings.timezone.string
		);
	}, [ creationDate, dateSettings ] );

	const relativeDate = useMemo( () => {
		return humanTimeDiff( creationDate, currentDate );
	}, [ creationDate, currentDate ] );

	const dateString = useMemo( () => {
		return relative ? relativeDate : absoluteDate;
	}, [ relative, relativeDate, absoluteDate ] );

	useEffect( () => {
		const interval = setInterval( () => {
			setCurrentDate( new Date() );
		}, refreshInterval );
		return () => clearInterval( interval );
	}, [] );

	return (
		<span { ...blockProps } ref={ ref }>
			{ dateString }
		</span>
	);
} );
