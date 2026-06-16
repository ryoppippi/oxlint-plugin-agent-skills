import { describe, expect, it } from 'vitest';

import { validateReferenceDepth } from '../src/references.ts';

describe('validateReferenceDepth', () => {
	it('accepts top-level and one-directory references', () => {
		const issues = validateReferenceDepth(`
See [forms](FORMS.md).
See [API details](references/api.md).
Run [the script](scripts/validate.sh).
`);

		expect(issues).toEqual([]);
	});

	it('reports references nested more than one directory deep', () => {
		const issues = validateReferenceDepth(`
See [API details](references/platform/api.md).
`);

		expect(issues).toEqual([
			{
				line: 2,
				message:
					'Reference "references/platform/api.md" is nested too deeply; link files at most one directory below SKILL.md.',
			},
		]);
	});

	it('ignores external links and Markdown inside code blocks', () => {
		const issues = validateReferenceDepth(`
See [the specification](https://agentskills.io/specification).

\`\`\`markdown
[Nested example](references/platform/api.md)
\`\`\`
`);

		expect(issues).toEqual([]);
	});
});
