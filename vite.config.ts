import { configDefaults, defineConfig } from 'vite-plus';

export default defineConfig({
	fmt: {
		ignorePatterns: ['**/__fixture__/**', 'dist/**', '.direnv/**', 'node_modules/**'],
		singleQuote: true,
		useTabs: true,
	},
	lint: {
		categories: {
			correctness: 'error',
			perf: 'error',
			suspicious: 'error',
		},
		ignorePatterns: ['**/__fixture__/**', 'dist/**', '.direnv/**', 'node_modules/**'],
		jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
		plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'import', 'node', 'promise', 'vitest'],
		options: {
			denyWarnings: true,
			typeAware: true,
			typeCheck: true,
		},
		rules: {
			'typescript/no-misused-promises': 'error',
			'typescript/no-unnecessary-boolean-literal-compare': 'error',
			'typescript/no-unnecessary-condition': 'error',
			'typescript/no-unnecessary-template-expression': 'error',
			'typescript/no-unnecessary-type-arguments': 'error',
			'typescript/no-unnecessary-type-assertion': 'error',
			'typescript/no-unnecessary-type-conversion': 'error',
			'typescript/no-unsafe-argument': 'error',
			'typescript/no-unsafe-assignment': 'error',
			'typescript/no-unsafe-call': 'error',
			'typescript/no-unsafe-enum-comparison': 'error',
			'typescript/no-unsafe-member-access': 'error',
			'typescript/no-unsafe-return': 'error',
			'typescript/only-throw-error': 'error',
			'typescript/prefer-promise-reject-errors': 'error',
			'typescript/require-await': 'error',
			'typescript/restrict-plus-operands': 'error',
			'typescript/return-await': 'error',
			'typescript/switch-exhaustiveness-check': 'error',
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
	run: {
		tasks: {
			check: {
				command: ['vp check', 'vp run test'],
			},
			'format-check': {
				command: 'vp fmt --check',
			},
			lint: {
				command: 'vp lint',
			},
			pack: {
				command: 'vp pack',
				output: ['dist/**'],
			},
			test: {
				command: 'vp test run',
				dependsOn: ['pack'],
			},
		},
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
