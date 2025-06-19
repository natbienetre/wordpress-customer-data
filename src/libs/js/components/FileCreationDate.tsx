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
import { Popover } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { humanTimeDiff } from '@wordpress/date';
import type { VisitorUploadedFile } from 'global';

export const FileCreationDate: React.FC< {
	visitorFile: VisitorUploadedFile;
} > = ( { visitorFile } ) => {
	const [ isVisible, setIsVisible ] = useState< boolean >( false );

	return (
		<div
			onMouseOver={ () => setIsVisible( true ) }
			onFocus={ () => setIsVisible( true ) }
			onMouseLeave={ () => setIsVisible( false ) }
			onBlur={ () => setIsVisible( false ) }
		>
			{ humanTimeDiff( visitorFile.creationDate, undefined ) }
			{ isVisible && (
				<div style={ { display: 'inline' } }>
					<Popover className="customer-data-popover">
						{ visitorFile.creationDate.toLocaleString() }
					</Popover>
				</div>
			) }
		</div>
	);
};
