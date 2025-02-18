/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest/presets/default-esm',
	collectCoverage: false,
	coverageDirectory: 'coverage',
	coverageProvider: 'v8',
	collectCoverageFrom: ['nodes/**/*.ts'],
	coveragePathIgnorePatterns: [
		'<rootDir>/nodes/common/types.ts',
		'<rootDir>/nodes/VectorStoreRedis/VectorStoreRedis.node.ts',
	],
	testPathIgnorePatterns: ['/node_modules/', '/dist/'],
	transform: {},
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	testEnvironment: 'node',
};
