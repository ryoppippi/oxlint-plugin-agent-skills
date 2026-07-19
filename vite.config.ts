import { configDefaults, defineConfig } from 'vite-plus';

export default defineConfig({
	fmt: {
		ignorePatterns: ['**/__fixture__/**', 'dist/**', '.direnv/**', 'node_modules/**'],
		singleQuote: true,
		useTabs: true,
	},
	lint: {
		ignorePatterns: ['**/__fixture__/**', 'dist/**', '.direnv/**', 'node_modules/**'],
		jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
		options: {
			denyWarnings: true,
			typeAware: true,
			typeCheck: true,
		},
		rules: {
			'vite-plus/prefer-vite-plus-imports': 'error',
		},
	},
	pack: {
		clean: true,
		define: {
			'import.meta.vitest': 'undefined',
		},
		dts: true,
		entry: ['src/index.ts'],
		fixedExtension: false,
		format: ['esm'],
	},
	test: {
		coverage: {
			include: ['src/**/*.ts'],
		},
		exclude: [...configDefaults.exclude, '**/.direnv/**'],
		globals: true,
		includeSource: ['src/**/*.ts'],
	},
});
