const config = {
	preset: 'jest-expo',
	moduleNameMapper: {
		'^lucide-react-native$':
			'<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
	},
	testMatch: ['<rootDir>/src/**/*.test.[jt]s?(x)'],
	setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
	clearMocks: true,
	restoreMocks: true,
	collectCoverageFrom: [
		'src/api/**/*.ts',
		'src/hooks/useDemoWallet/index.ts',
		'src/session/sessionStore.ts',
		'src/screens/WalletScreen/index.tsx',
		'!**/types.ts',
		'!**/*.test.ts',
	],
	coverageDirectory: 'coverage',
};

module.exports = config;
