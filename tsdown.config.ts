import { defineConfig } from 'tsdown';

export default defineConfig({
	clean: true,
	define: {
		'import.meta.vitest': 'undefined',
	},
	dts: true,
	entry: ['src/index.ts'],
	fixedExtension: false,
	format: ['esm'],
});
