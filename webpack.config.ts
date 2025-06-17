/**
 * Webpack Configuration
 *
 * @version 1.0.0
 * @author Pierre Peronnet <pierre.peronnet@gmail.com>
 * @license GPL-2.0-or-later
 * @description Webpack configuration for building assets.
 */

// @ts-ignore
import defaultConfigs from '@wordpress/scripts/config/webpack.config.js';
import { DefinePlugin, ProvidePlugin } from 'webpack';
import type { Configuration } from 'webpack';

const defaultEntries =
	typeof defaultConfigs[ 0 ].entry === 'function'
		? defaultConfigs[ 0 ].entry()
		: defaultConfigs[ 0 ].entry || {};

const config0: Configuration = {
	...defaultConfigs[ 0 ],
	entry: {
		'admin-settings/editor': './src/admin-settings/editor.ts',
		'shortcodes/token-field': './src/shortcodes/token-field.tsx',
		'admin-settings/settings-page':
			'./src/admin-settings/settings-page.tsx',
		'admin-settings/tool-create-token':
			'./src/admin-settings/tool-create-token.tsx',
		'admin-settings/tool-inspect-token':
			'./src/admin-settings/tool-inspect-token.tsx',
		frontend: './src/frontend.ts',

		...defaultEntries,
	},
	resolve: {
		...defaultConfigs[ 0 ].resolve,
		fallback: {
			path: require.resolve( 'path-browserify' ),
			stream: false,
			vm: false,
			process: false,
			fs: false,
			crypto: false,
			zlib: false,
			...defaultConfigs[ 0 ].resolve?.fallback,
		},
	},
	module: {
		...defaultConfigs[ 0 ].module,
		rules: [
			{
				test: /\.(ts|tsx)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: [
								'@babel/preset-env',
								'@babel/preset-typescript',
								[
									'@babel/preset-react',
									{ runtime: 'automatic' },
								],
								'@wordpress/babel-preset-default',
							],
							plugins: [
								'@babel/plugin-transform-runtime',
								'@babel/plugin-transform-class-properties',
								'@babel/plugin-transform-object-rest-spread',
							],
						},
					},
				],
			},
			...( defaultConfigs[ 0 ].module?.rules || [] ),
		],
	},
	plugins: [
		new ProvidePlugin( { process: 'process/browser' } ),
		new DefinePlugin( {
			'webpack.compilation.date': JSON.stringify( new Date().toJSON() ),
		} ),
		...( Array.isArray( defaultConfigs[ 0 ].plugins )
			? defaultConfigs[ 0 ].plugins
			: [] ),
	],
};

const config1: Configuration = {
	...defaultConfigs[ 1 ],
	entry: {
		'blocks/lib': './src/blocks/lib.ts',
		'admin-settings/settings-page-interactivity':
			'./src/admin-settings/settings-page-interactivity.tsx',
		'admin-settings/tool-create-token-interactivity':
			'./src/admin-settings/tool-create-token-interactivity.tsx',
		'admin-settings/tool-inspect-token-interactivity':
			'./src/admin-settings/tool-inspect-token-interactivity.tsx',
		'admin-settings/token-visibility/frontend-interactivity':
			'./src/admin-settings/token-visibility/frontend-interactivity.ts',

		...defaultConfigs[ 1 ].entry(),
	},
};

export default [ config0, config1 ];
