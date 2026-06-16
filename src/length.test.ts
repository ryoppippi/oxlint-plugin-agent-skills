import { describe, expect, it } from 'vitest';

import { validateSkillLength } from './length.ts';

describe('validateSkillLength', () => {
	it('accepts a SKILL.md with 500 lines', () => {
		expect(validateSkillLength(`${'line\n'.repeat(500)}`)).toBeUndefined();
	});

	it('reports a SKILL.md with more than 500 lines', () => {
		expect(validateSkillLength(`${'line\n'.repeat(501)}`)).toEqual({
			line: 501,
			message:
				'SKILL.md has 501 lines; keep it at or below 500 lines and move details into referenced files.',
		});
	});
});
