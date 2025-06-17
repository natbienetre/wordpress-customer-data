/**
 * @template T
 * @param {APIFetchOptions} options
 * @return {Promise<T>} A promise representing the request processed via the registered middlewares.
 */

type ApiFetch< T > = ( options: APIFetchOptions ) => Promise< T >;

export default ApiFetch;

export interface APIFetchOptions extends RequestInit {
	// Override headers, we only accept it as an object due to the `nonce` middleware
	headers?: Record< string, string >;
	path?: string;
	url?: string;
	/**
	 * @default true
	 */
	parse?: boolean;
	data?: any;
	namespace?: string;
	endpoint?: string;
}
