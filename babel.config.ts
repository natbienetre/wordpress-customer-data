import type { ConfigFunction } from '@babel/core';

const config: ConfigFunction = () => ( {
	presets: [
		'@babel/preset-env',
		'@babel/preset-typescript',
		[
			'@babel/preset-react',
			{
				runtime: 'automatic',
			},
		],
	],
	plugins: [ '@babel/plugin-transform-modules-commonjs' ],
} );

export default config;
