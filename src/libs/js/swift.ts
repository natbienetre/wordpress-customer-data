import type WordPressUrl from 'wordpress/url';

export const pathDelimiter = '/';

export function normalizePath( path: string ): string {
	return path
		.replace( new RegExp( pathDelimiter + '{2,}' ), pathDelimiter )
		.replace( new RegExp( '^' + pathDelimiter + '*' ), '' )
		.replace( new RegExp( pathDelimiter + '*$' ), '' );
}

export function pathJoin( ...paths: string[] ): string {
	paths = paths
		.map( ( path ) =>
			path.replace( new RegExp( pathDelimiter + '{2,}' ), pathDelimiter )
		)
		.filter( ( path ) => path !== '' );

	if ( paths.length === 0 ) {
		return '';
	}

	if ( paths.length === 1 ) {
		return paths[ 0 ];
	}

	return (
		paths[ 0 ].replace(
			new RegExp( '([^' + pathDelimiter + '])$' ),
			'$1' + pathDelimiter
		) +
		paths
			.slice( 1, -1 )
			.map( normalizePath )
			.filter( Boolean )
			.join( pathDelimiter ) +
		paths[ paths.length - 1 ].replace(
			new RegExp( '^([^' + pathDelimiter + '])' ),
			( paths.length > 2 ? pathDelimiter : '' ) + '$1'
		)
	);
}
export const cleanURL = (
	wordpressUrl: WordPressUrl,
	url: string | URL
): URL => {
	return new URL(
		wordpressUrl.removeQueryArgs(
			url.toString(),
			'temp_url_sig',
			'temp_url_prefix',
			'temp_url_expires'
		)
	);
};

export function relativeTo( from: string, to: string ): string {
	const froms = from.split( pathDelimiter );
	const tos = to.split( pathDelimiter );

	for ( let i = 0; i < froms.length; i++ ) {
		if ( froms[ i ] !== tos[ i ] ) {
			return pathJoin( ...tos.slice( i ) );
		}
	}

	return pathJoin( ...tos.slice( froms.length ) );
}
