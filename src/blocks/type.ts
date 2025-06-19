import type { TokenV1 } from 'token';
import { CustomerDataConfiguration } from '../libs/js/configuration';
import type { SwiftFile } from '../libs/js/file-upload';
import type { JSONWebKeySet } from 'jose';

export type FileUploadStatus =
	| 'pending'
	| 'uploading'
	| 'uploaded'
	| 'deleting'
	| 'error';

export type ErrorCode =
	| 'invalid-file-type'
	| 'too-many-files'
	| 'upload-failed'
	| 'delete-failed';

export type RemoteFile = {
	/**
	 * The name of the `File`.
	 */
	name: string;
	/**
	 * The creation date of the `File`.
	 */
	creationDate: Date;

	/**
	 * The total size of the `Blob` in bytes.
	 */
	size: number;
	/**
	 * The content-type of the `Blob`.
	 */
	type: string;

	/**
	 * The number of bytes uploaded.
	 */
	uploaded: number;

	/**
	 * The error code.
	 */
	error: ErrorCode | null;

	/**
	 * The remote path of the file.
	 */
	remotePath: string;
};

export type Status = {
	status: {
		inProgress: boolean;
		error: boolean;
		success: boolean;
	};
};

export type FileWithStatus = RemoteFile & Status;

export type PostContext = {
	pageSpace: string;
	filesInventoryRemotePath: string;
};

export type FileUploadContext = {
	files: FileWithStatus[];
	nbFiles: number;
	destination: string;
	pageSpace: string;
	extractArchive: boolean;
	filesInventoryRemotePath: string | null;
	ready: boolean;
	accept: string[];
};

export type FileContext = {
	file: FileWithStatus;
};

export type TokenState = 'valid' | 'invalid' | 'loading';

export type CustomerDataState = {
	tokenIs: ( visibility: TokenState ) => boolean;
	files: FileWithStatus[] | undefined;
	token: TokenV1 | false | null;
	configuration: CustomerDataConfiguration | null;
	swiftFile: SwiftFile | null;
};

export type CustomerDataActions = {
	updateFileInventory: () => Promise< void >;
};

export type CustomerDataConfig = {
	prefix: string;
	container: string;
	swiftBaseUrl: string;
	keySet: JSONWebKeySet;
};
