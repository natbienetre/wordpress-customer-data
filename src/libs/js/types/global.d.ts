import type { WordPressUrl } from 'wordpress/url';
import type { OpenStackOptions } from '../options';
import type { Token } from '../token';
import type { JSONWebKeySet } from 'jose';
import { ApiFetch } from 'wordpress/api-fetch';
import type WordPress from 'wordpress';

declare global {
	interface Window {
		customerDataOptions: CustomerDataOptions | undefined;
		customerDataToken: Token | undefined;
		customerDataKeys: JSONWebKeySet | undefined;
		customerDataConfig:
			| {
					options: Partial< OpenStackOptions >;
			  }
			| undefined;
		wp: {
			template: ( id: string ) => ( data: any ) => string;
		};
		customerData: {
			swiftFile: SwiftFile | undefined;
			configuration: CustomerDataConfiguration | undefined;
		} | undefined;
		customerDataCallbacks: {
			deleteBlock: {
				delete: ( event: MouseEvent ) => void;
			} | undefined;
		} | undefined;
	}

    const wp: WordPress;

	const webpack: {
		compilation: {
			date: string;
		}
	}
}

export type VisitorUploadedFile = {
	name: string;
	type: string;
	size: number;
	creationDate: Date;
	remotePath: string;
}

export type VisitorNewFile = VisitorUploadedFile & {
	blob: Blob;
}

export interface SwiftFile {
	delete: ( filePath: string ) => Promise< true >;
	upload: ( filePath: string, file: VisitorNewFile, progressCallback?: ( loaded: number, total: number ) => void ) => Promise< void >;
}

export interface CustomerDataConfiguration {
	fileURL(
		filePath: string | VisitorUploadedFile,
		method: string | undefined = undefined
	): URL;
}
