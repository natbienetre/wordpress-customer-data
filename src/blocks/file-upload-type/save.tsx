/**
 * File Upload Info Block
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description This block displays information about uploaded files.
 */

import { useBlockProps } from '@wordpress/block-editor';

export const Save: React.FC = () => {
	const blockProps = useBlockProps.save();

	return <span { ...blockProps } data-wp-text="customer-data::context.file.type" />;
};
