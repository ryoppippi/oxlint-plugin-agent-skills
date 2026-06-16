import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts'],
		},
		include: ['src/**/*.test.ts'],
	},
});
