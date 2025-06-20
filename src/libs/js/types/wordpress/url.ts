interface WordPressUrl {
	safeDecodeURIComponent: ( url: string ) => string;
	removeQueryArgs: ( url: string, ...args: string[] ) => string;
	/**
	 * Appends arguments as querystring to the provided URL. If the URL already
	 * includes query arguments, the arguments are merged with (and take precedent
	 * over) the existing set.
	 *
	 * @param {string} [url=''] URL to which arguments should be appended. If omitted,
	 *                          only the resulting querystring is returned.
	 * @param {Object} [args]   Query arguments to apply to URL.
	 *
	 * @example
	 * ```js
	 * const newURL = addQueryArgs( 'https://google.com', { q: 'test' } ); // https://google.com/?q=test
	 * ```
	 *
	 * @return {string} URL with arguments applied.
	 */
	addQueryArgs: ( url: string, args: Object ) => string;
}

export default WordPressUrl;
