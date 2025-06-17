import JSZip from 'jszip';
import {
	type OpenstackEntry,
	SwiftConfiguration,
	VfsConfiguration,
} from './configuration';
import type {
	VisitorNewFile,
	VisitorUploadedFile,
	SwiftFile as _SwiftFile,
} from './types/global.d';
import {
	pathDelimiter,
	normalizePath,
	pathJoin,
	cleanURL,
	relativeTo,
} from './swift';
import type WordPressUrl from 'wordpress/url';

const orignalFilenameHeader = 'X-Object-Meta-InputName';

export interface FileFieldProps {
	file: VisitorUploadedFile;
}

export interface FileFieldItemProps {
	item: VisitorUploadedFile;
}

export class HTTPStatusError extends Error {
	constructor(
		public readonly status: number,
		public readonly response: string
	) {
		super( `HTTP status ${ status }: ${ response }` );
	}
}

export abstract class SwiftAPI {
	public readonly swiftConfiguration: SwiftConfiguration;
	public readonly wordpressUrl: WordPressUrl;

	constructor(
		swiftConfiguration: SwiftConfiguration,
		wordpressUrl: WordPressUrl
	) {
		this.swiftConfiguration = swiftConfiguration;
		this.wordpressUrl = wordpressUrl;
	}

	/**
	 * Create a new XMLHttpRequest object.
	 * @param {string} method HTTP method
	 * @param {string} url    URL
	 * @return {XMLHttpRequest} XMLHttpRequest object
	 */
	protected async newXhr(
		method: string,
		url: string | URL
	): Promise< XMLHttpRequest > {
		const xhr = new XMLHttpRequest();
		xhr.open( method, url.toString(), true );
		return xhr;
	}

	protected async do(
		xhr: XMLHttpRequest,
		...expectedStatuses: number[]
	): Promise< XMLHttpRequest > {
		return this.doWithBody( xhr, null, ...expectedStatuses );
	}

	protected async doWithBody(
		xhr: XMLHttpRequest,
		body: Document | XMLHttpRequestBodyInit | null,
		...expectedStatuses: number[]
	): Promise< XMLHttpRequest > {
		return new Promise( ( resolve, reject ) => {
			xhr.onload = () => {
				if ( ! expectedStatuses.includes( xhr.status ) ) {
					reject(
						new HTTPStatusError( xhr.status, xhr.responseText )
					);
					return;
				}

				resolve( xhr );
			};

			xhr.onerror = ( err ) => {
				if ( ! expectedStatuses.includes( xhr.status ) ) {
					reject(
						new HTTPStatusError( xhr.status, xhr.responseText )
					);
					return;
				}

				reject( err );
			};

			xhr.send( body );
		} );
	}

	async zip(
		destination: JSZip | null,
		progressCallback: ( count: number, total: number ) => void = () => {},
		...files: string[]
	): Promise< void > {
		const zipFile = destination ?? new JSZip();
		const promises = [];
		const errors: { [ filepath: string ]: Error } = {};

		let count = 0;

		for ( const remotePath of files ) {
			promises.push(
				this.newXhr(
					'GET',
					this.swiftConfiguration.fileURL( remotePath )
				)
					.then( ( xhr ) => this.do( xhr, 200 ) )
					.then( ( completedXhr ) =>
						zipFile.file( remotePath, completedXhr.response )
					)
					.catch( ( error: Error ) => {
						errors[ remotePath ] = error;
						return null;
					} )
					.finally( () => {
						count++;
						progressCallback( count, Object.keys( files ).length );
					} )
			);
		}

		return Promise.all( promises ).then( () => {
			if ( Object.keys( errors ).length > 0 ) {
				throw new ZipError( errors );
			}
		} );
	}

	async get( filePath: string ): Promise< VisitorUploadedFile > {
		return this.newXhr(
			'HEAD',
			this.swiftConfiguration.fileURL( filePath )
		).then( ( xhr ) => {
			xhr.setRequestHeader( 'X-Newest', 'true' );
			return this.do( xhr, 200 ).then( ( completedXhr ) => {
				return {
					...this.fileFromXhr( completedXhr ),
					remotePath: filePath,
				};
			} );
		} );
	}

	protected fileFromXhr(
		xhr: XMLHttpRequest
	): Omit< VisitorUploadedFile, 'remotePath' > {
		const destination = new URL( xhr.responseURL );
		return {
			name:
				xhr.getResponseHeader( orignalFilenameHeader ) ??
				this.wordpressUrl.safeDecodeURIComponent(
					destination.pathname.split( pathDelimiter ).pop()!
				),
			type: xhr.getResponseHeader( 'Content-Type' )!,
			size: parseInt( xhr.getResponseHeader( 'Content-Length' )! ),
			creationDate: new Date(
				Number( xhr.getResponseHeader( 'X-Timestamp' )! ) * 1000
			),
		};
	}

	async delete( filePath: string ): Promise< true > {
		return this.newXhr(
			'DELETE',
			this.swiftConfiguration.fileURL( filePath )
		).then( ( xhr ) => {
			return this.do( xhr, 204, 404 ).then( () => {
				return true;
			} );
		} );
	}

	async read( filePath: string ): Promise< string > {
		return this.newXhr(
			'GET',
			this.swiftConfiguration.fileURL( filePath )
		).then( ( xhr ) => {
			xhr.setRequestHeader( 'X-Newest', 'true' );
			return this.do( xhr, 200 ).then(
				( completedXhr ) => completedXhr.responseText
			);
		} );
	}

	async *list(
		prefix: string = '',
		cb: ( count: number, total: number ) => void = () => {}
	): AsyncIterable< string | VisitorUploadedFile > {
		for await ( const item of this.listItems( prefix, true, cb ) ) {
			yield this.fileFromItem(
				this.swiftConfiguration.siteURL(),
				prefix + pathDelimiter,
				item
			);
		}
	}

	async *deepList(
		prefix: string = '',
		cb: ( count: number, total: number ) => void = () => {}
	): AsyncIterable< VisitorUploadedFile & { remotePath: string } > {
		const relativePrefix = relativeTo(
			prefix,
			this.swiftConfiguration.prefix()
		);
		for await ( const item of this.listItems( prefix, false, cb ) ) {
			yield {
				...( this.fileFromItem(
					this.swiftConfiguration.siteURL(),
					prefix + pathDelimiter,
					item
				) as VisitorUploadedFile ),
				remotePath: this.swiftConfiguration.entryPath(
					relativePrefix,
					item
				),
			};
		}
	}

	protected async *listItems(
		prefix: string,
		useDelimiter: boolean,
		cb: ( count: number, total: number ) => void = () => {}
	): AsyncIterable< OpenstackEntry > {
		const containerURL = this.swiftConfiguration.containerURL();

		prefix = normalizePath( prefix ) + pathDelimiter;

		const limit = 1000;
		const queryArgs: Record< string, string | number > = {
			format: 'json',
			prefix,
			limit,
		};

		if ( useDelimiter ) {
			queryArgs.delimiter = pathDelimiter;
		}

		const requestUrl = this.wordpressUrl.addQueryArgs(
			containerURL.toString(),
			queryArgs
		);

		let startMarker = '';
		let count = 0;

		while ( true ) {
			const data = await this.newXhr(
				'GET',
				startMarker
					? this.wordpressUrl.addQueryArgs( requestUrl, {
							marker: startMarker,
					  } )
					: requestUrl
			)
				.then( ( xhr ) => this.do( xhr, 200 ) )
				.then( ( completedXhr ) => {
					const items = JSON.parse( completedXhr.responseText );
					count += items.length;
					cb(
						count,
						parseInt(
							completedXhr.getResponseHeader(
								'X-Container-Object-Count'
							) || count.toString()
						)
					);
					return items;
				} );

			for ( const item of data ) {
				yield item;
				startMarker = 'subdir' in item ? item.subdir : item.name;
			}

			if ( data.length < limit ) {
				break;
			}
		}
	}

	protected fileFromItem(
		containerURL: string | URL,
		prefix: string,
		item: OpenstackEntry
	): VisitorUploadedFile | string {
		if ( 'subdir' in item ) {
			return normalizePath( item.subdir.substring( prefix.length ) );
		}

		const url = new URL( containerURL );
		url.pathname = pathJoin(
			url.pathname,
			item.name.substring( this.swiftConfiguration.sitePrefix().length )
		);

		return {
			name: item.name.substring( prefix.length ),
			type: item.content_type,
			size: item.bytes,
			creationDate: new Date( item.last_modified ),
			remotePath: this.swiftConfiguration.filePath( item.name ),
		};
	}
}

export class SwiftFile extends SwiftAPI implements _SwiftFile {
	constructor(
		public readonly vfsConfiguration: VfsConfiguration,
		wordpressUrl: WordPressUrl
	) {
		super( vfsConfiguration, wordpressUrl );
	}

	async *deepList(
		prefix: string = '',
		cb: ( count: number, total: number ) => void = () => {}
	): AsyncIterable< VisitorUploadedFile & { remotePath: string } > {
		prefix = this.vfsConfiguration.prefix( prefix );

		return super.deepList( prefix, cb );
	}

	/**
	 * Create a new XMLHttpRequest object.
	 * @param {string} method HTTP method
	 * @param {string} url    URL
	 * @return {XMLHttpRequest} XMLHttpRequest object
	 */
	protected async newXhr(
		method: string,
		url: string | URL
	): Promise< XMLHttpRequest > {
		const xhr = new XMLHttpRequest();
		const urlWithParams = this.wordpressUrl.addQueryArgs(
			cleanURL( this.wordpressUrl, url ).toString(),
			this.vfsConfiguration.swiftQueryParamsForMethod( method )
		);
		xhr.open( method, urlWithParams, true );
		return xhr;
	}
	/*
	protected async do(
		xhr: XMLHttpRequest,
		...expectedStatuses: number[]
	): Promise< XMLHttpRequest > {
		return super.do( xhr, ...expectedStatuses ).catch( ( error ) => {
			if ( error instanceof HTTPStatusError && error.status === 401 ) {
				const expiredAt = this.vfsConfiguration.vfsToken.expiredAt();
				if ( expiredAt ) {
					throw new VfsTokenExpiredError( expiredAt, xhr );
				} else {
					throw new VfsAuthenticationError( xhr );
				}
			}

			throw error;
		} );
	}
*/
	protected async doWithBody(
		xhr: XMLHttpRequest,
		body: Document | XMLHttpRequestBodyInit | null,
		...expectedStatuses: number[]
	): Promise< XMLHttpRequest > {
		return super
			.doWithBody( xhr, body, ...expectedStatuses )
			.catch( ( error ) => {
				if (
					error instanceof HTTPStatusError &&
					error.status === 401
				) {
					const expiredAt =
						this.vfsConfiguration.vfsToken.expiredAt();
					if ( expiredAt ) {
						throw new VfsTokenExpiredError( expiredAt, xhr );
					} else {
						throw new VfsAuthenticationError( xhr );
					}
				}

				throw error;
			} );
	}

	async upload(
		filePath: string,
		file: VisitorNewFile,
		progressCallback?: ( loaded: number, total: number ) => void
	): Promise< void > {
		return this.newXhr(
			'PUT',
			this.swiftConfiguration.fileURL( filePath )
		).then( ( xhr ) => {
			xhr.setRequestHeader( orignalFilenameHeader, file.name );
			xhr.setRequestHeader( 'Content-Type', file.type );
			if ( '' === file.type ) {
				xhr.setRequestHeader( 'X-Detect-Content-Type', 'True' );
			}
			xhr.setRequestHeader(
				'Content-Disposition',
				`attachment; filename="${ encodeURIComponent( file.name ) }"`
			);

			xhr.upload.onprogress = ( event ) => {
				if ( event.lengthComputable ) {
					progressCallback?.( event.loaded, event.total );
				}
			};

			return this.doWithBody( xhr, file.blob, 201 ).then( () => {} );
		} );
	}
}

export const fileUrl = (
	uploadUrl: string,
	nbFiles: number,
	destination: string,
	file: VisitorNewFile | null = null
): string => {
	return `${ uploadUrl }${ destination }${
		nbFiles > 1 && file ? encodeURIComponent( file.name ) : ''
	}`.replace( /\/+$/, '' );
};

export class ZipError extends Error {
	constructor( public readonly errors: { [ filepath: string ]: Error } ) {
		super( 'Zip errors' );
	}
}

export class VfsAuthenticationError extends Error {
	constructor( public readonly cause: XMLHttpRequest ) {
		super( 'Unauthorized. Please contact the administrator.' );
		this.name = 'VfsAuthenticationError';
	}
}

export class VfsTokenExpiredError extends Error {
	constructor(
		public readonly expiredAt: Date,
		public readonly cause: XMLHttpRequest
	) {
		super( `Token expired at ${ expiredAt.toISOString() }` );
		this.name = 'VfsTokenExpiredError';
	}
}
