export const addClassName = (
	classNames: string | string[] | undefined,
	firstClassName: string,
	...extraClassNames: string[]
): string =>
	[
		...new Set(
			[
				firstClassName,
				...extraClassNames,
				...( Array.isArray( classNames )
					? classNames
					: classNames?.split( ' ' ) ?? [] ),
			].filter( Boolean )
		),
	].join( ' ' );

export const removeClassName = (
	classNames: string | string[] | undefined,
	firstClassName: string,
	...otherClassNames: string[]
) =>
	[
		...new Set(
			[
				...( Array.isArray( classNames )
					? classNames
					: classNames?.split( ' ' ) ?? [] ),
			]
				.filter( Boolean )
				.filter(
					( className ) =>
						firstClassName !== className &&
						! otherClassNames.includes( className )
				)
		),
	].join( ' ' );
