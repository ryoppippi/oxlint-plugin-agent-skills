import { describe, expect, it } from 'vitest';

import { validateDirectoryName } from './name-matches-directory.ts';

describe('validateDirectoryName', () => {
	it('accepts a name matching the skill directory', () => {
		const issue = validateDirectoryName(
			'/repo/skills/reviewing-code/SKILL.md',
			`---
name: reviewing-code
description: Reviews code. Use when inspecting changes.
---
`,
		);

		expect(issue).toBeUndefined();
	});

	it('reports a name that differs from the skill directory', () => {
		const issue = validateDirectoryName(
			'/repo/skills/reviewing-code/SKILL.md',
			`---
name: code-review
description: Reviews code. Use when inspecting changes.
---
`,
		);

		expect(issue).toEqual({
			line: 2,
			message: 'Skill name "code-review" must match its parent directory "reviewing-code".',
		});
	});

	it('skips comparison when frontmatter is invalid', () => {
		const issue = validateDirectoryName(
			'/repo/skills/reviewing-code/SKILL.md',
			'name: reviewing-code',
		);

		expect(issue).toBeUndefined();
	});
});
