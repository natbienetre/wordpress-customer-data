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
import { __ } from '@wordpress/i18n';
import { Icon, Popover } from '@wordpress/components';
import { useState } from '@wordpress/element';
import type { VisitorUploadedFile } from 'global';
import { fileTypeDashicon } from '../icon';

import './EditorSidebar.scss';

export const FileType: React.FC< { visitorFile: VisitorUploadedFile } > = ( {
	visitorFile,
} ) => {
	const [ isVisible, setIsVisible ] = useState< boolean >( false );

	return (
		<div
			onMouseOver={ () => setIsVisible( true ) }
			onFocus={ () => setIsVisible( true ) }
			onMouseLeave={ () => setIsVisible( false ) }
			onBlur={ () => setIsVisible( false ) }
		>
			<Icon icon={ fileTypeDashicon( visitorFile ) } />
			{ isVisible && (
				<Popover
					headerTitle={ __( 'File type', 'customer-data' ) }
					className="customer-data-popover"
				>
					{ visitorFile.type }
				</Popover>
			) }
		</div>
	);
};
