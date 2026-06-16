import { describe, expect, it } from 'vitest';

import plugin from '../src/index.ts';

describe('plugin', () => {
	it('exports the oxlint-plugin-skills JavaScript plugin', () => {
		expect(plugin.meta?.name).toBe('oxlint-plugin-skills');
		expect(plugin.rules).toBeTypeOf('object');
	});
});
