import type { PackageJSON, ResolverOptions } from 'jest-resolve';

const resolver = ( path: string, options: ResolverOptions ): string => {
	return options.defaultResolver( path, {
		...options,
		packageFilter: ( pkg: PackageJSON, file: string, dir: string ) => {
			if ( pkg.name === 'jose' ) {
				return {
					...pkg,
					main: pkg.browser || pkg.main,
				};
			}
			return options.packageFilter
				? options.packageFilter( pkg, file, dir )
				: pkg;
		},
	} );
};

export default resolver;
