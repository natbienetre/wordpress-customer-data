import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@wordpress/(.*)$': '<rootDir>/node_modules/@wordpress/$1',
	},
	transform: {
		'^.+\\.[tj]sx?$': [
			'babel-jest',
			{
				presets: [
					[ '@babel/preset-env', { targets: { node: 'current' } } ],
					'@babel/preset-typescript',
				],
			},
		],
	},
	transformIgnorePatterns: [],
	setupFilesAfterEnv: [ '<rootDir>/src/libs/js/__tests__/setup.ts' ],
	testMatch: [ '**/__tests__/**/*.test.ts' ],
	moduleFileExtensions: [ 'ts', 'tsx', 'js', 'jsx', 'json', 'node' ],
};

export default config;
