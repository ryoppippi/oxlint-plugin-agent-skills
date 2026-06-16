import { describe, expect, it } from 'vitest';

import { validateFrontmatter } from '../src/frontmatter.ts';

describe('validateFrontmatter', () => {
	it('accepts valid Agent Skill frontmatter', () => {
		const issues = validateFrontmatter(`---
name: reviewing-code
description: Reviews code for correctness. Use when inspecting a change.
license: MIT
compatibility: Requires git.
metadata:
  author: example
allowed-tools: Read Bash(git:*)
---

# Reviewing Code
`);

		expect(issues).toEqual([]);
	});

	it('requires a closed YAML frontmatter block', () => {
		const issues = validateFrontmatter(`---
name: reviewing-code
description: Reviews code.
`);

		expect(issues.map(({ code, line }) => ({ code, line }))).toEqual([
			{ code: 'unclosed-frontmatter', line: 1 },
		]);
	});

	it('reports invalid YAML at its SKILL.md line', () => {
		const issues = validateFrontmatter(`---
name: reviewing-code
description: [
---
`);

		expect(issues.map(({ code, line }) => ({ code, line }))).toEqual([
			{ code: 'invalid-frontmatter', line: 3 },
		]);
	});

	it('requires name and description fields', () => {
		const issues = validateFrontmatter(`---
license: MIT
---
`);

		expect(issues.map(({ code }) => code)).toEqual(['missing-name', 'missing-description']);
	});

	it.each([
		['Reviewing-Code', 'invalid-name'],
		['-reviewing-code', 'invalid-name'],
		['reviewing--code', 'invalid-name'],
		['claude-reviewing', 'reserved-name'],
	])('rejects the name %s', (name, expectedCode) => {
		const issues = validateFrontmatter(`---
name: ${name}
description: Reviews code. Use when inspecting a change.
---
`);

		expect(issues.map(({ code }) => code)).toContain(expectedCode);
	});

	it('validates optional field types', () => {
		const issues = validateFrontmatter(`---
name: reviewing-code
description: Reviews code. Use when inspecting a change.
license:
  kind: MIT
compatibility: 42
metadata:
  version: 1
allowed-tools:
  - Read
---
`);

		expect(issues.map(({ code }) => code)).toEqual([
			'invalid-license',
			'invalid-compatibility',
			'invalid-metadata-value',
			'invalid-allowed-tools',
		]);
	});
});
