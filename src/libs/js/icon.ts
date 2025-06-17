import type { IconKey } from '@wordpress/components/build-types/dashicon/types';
import type { VisitorUploadedFile } from 'global';

export const fileTypeDashicon = (
	visitorFile: VisitorUploadedFile
): IconKey => {
	// https://developer.wordpress.org/resource/dashicons/
	if ( visitorFile.type.startsWith( 'image/' ) ) {
		return 'format-image';
	} else if (
		[
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		].includes( visitorFile.type )
	) {
		return 'media-document';
	} else if (
		visitorFile.name.endsWith( '.pdf' ) ||
		visitorFile.name.endsWith( '.docx' ) ||
		visitorFile.name.endsWith( '.doc' ) ||
		visitorFile.name.endsWith( '.docm' )
	) {
		return 'media-document';
	} else if (
		visitorFile.name.endsWith( '.xls' ) ||
		visitorFile.name.endsWith( '.xlsx' )
	) {
		return 'media-spreadsheet';
	} else if (
		visitorFile.name.endsWith( '.png' ) ||
		visitorFile.name.endsWith( '.jpg' ) ||
		visitorFile.name.endsWith( '.jpeg' ) ||
		visitorFile.name.endsWith( '.gif' )
	) {
		return 'format-image';
	} else if (
		visitorFile.name.endsWith( '.mp3' ) ||
		visitorFile.name.endsWith( '.wav' ) ||
		visitorFile.name.endsWith( '.m4a' )
	) {
		return 'format-audio';
	} else if (
		visitorFile.name.endsWith( '.mp4' ) ||
		visitorFile.name.endsWith( '.mov' ) ||
		visitorFile.name.endsWith( '.avi' ) ||
		visitorFile.name.endsWith( '.wmv' ) ||
		visitorFile.name.endsWith( '.flv' ) ||
		visitorFile.name.endsWith( '.mpeg' ) ||
		visitorFile.name.endsWith( '.mpg' )
	) {
		return 'format-video';
	} else if (
		visitorFile.name.endsWith( '.zip' ) ||
		visitorFile.name.endsWith( '.rar' ) ||
		visitorFile.name.endsWith( '.tar' ) ||
		visitorFile.name.endsWith( '.gz' ) ||
		visitorFile.name.endsWith( '.bz2' )
	) {
		return 'media-archive';
	} else if (
		visitorFile.name.endsWith( '.txt' ) ||
		visitorFile.name.endsWith( '.csv' ) ||
		visitorFile.name.endsWith( '.json' )
	) {
		return 'media-text';
	} else if (
		visitorFile.name.endsWith( '.ppt' ) ||
		visitorFile.name.endsWith( '.pptx' )
	) {
		return 'media-interactive';
	}
	return 'media-default';
};
