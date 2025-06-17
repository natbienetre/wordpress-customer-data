/**
 * File Types Configuration
 *
 * @package
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description Configuration for file types supported by the upload block.
 */

import type { IconKey } from '@wordpress/components/build-types/dashicon/types';

/**
 * File type definition interface
 *
 * @since 1.0.0
 */
interface FileType {
	title: string;
	dashicon: IconKey;
}

/**
 * File types configuration
 *
 * @see https://developer.wordpress.org/resource/dashicons/
 *
 * @since 1.0.0
 */
export const fileTypes: Record< string, FileType > = {
	// documents
	'.pdf': {
		title: 'PDF',
		dashicon: 'media-document',
	},
	'.doc': {
		title: 'DOC',
		dashicon: 'media-document',
	},
	'.docx': {
		title: 'DOCX',
		dashicon: 'media-document',
	},
	'.csv': {
		title: 'CSV',
		dashicon: 'media-spreadsheet',
	},
	'.xls': {
		title: 'XLS',
		dashicon: 'media-spreadsheet',
	},
	'.xlsx': {
		title: 'XLSX',
		dashicon: 'media-spreadsheet',
	},
	// images
	'image/*': {
		title: 'Image',
		dashicon: 'format-image',
	},
	'.jpg': {
		title: 'JPG',
		dashicon: 'format-image',
	},
	'.jpeg': {
		title: 'JPEG',
		dashicon: 'format-image',
	},
	'.png': {
		title: 'PNG',
		dashicon: 'format-image',
	},
	'.gif': {
		title: 'GIF',
		dashicon: 'format-image',
	},
	'.bmp': {
		title: 'BMP',
		dashicon: 'format-image',
	},
	// audio
	'audio/*': {
		title: 'Audio',
		dashicon: 'media-audio',
	},
	'.mp3': {
		title: 'MP3',
		dashicon: 'media-audio',
	},
	'.wav': {
		title: 'WAV',
		dashicon: 'media-audio',
	},
	'.ogg': {
		title: 'OGG',
		dashicon: 'media-audio',
	},
	'.m4a': {
		title: 'M4A',
		dashicon: 'media-audio',
	},
	// video
	'video/*': {
		title: 'Video',
		dashicon: 'media-video',
	},
	'.mp4': {
		title: 'MP4',
		dashicon: 'media-video',
	},
	'.avi': {
		title: 'AVI',
		dashicon: 'media-video',
	},
	'.mov': {
		title: 'MOV',
		dashicon: 'media-video',
	},
	'.wmv': {
		title: 'WMV',
		dashicon: 'media-video',
	},
	'.flv': {
		title: 'FLV',
		dashicon: 'media-video',
	},
	'.mpeg': {
		title: 'MPEG',
		dashicon: 'media-video',
	},
};
