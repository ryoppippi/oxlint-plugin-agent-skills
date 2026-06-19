/**
 * Implements `skills/no-deep-references`.
 *
 * Agent Skill authoring guidance recommends linking supporting files no more
 * than one directory below SKILL.md. Shallow references make the skill easier
 * for an agent to navigate and avoid chains of documents that hide essential
 * instructions several levels away from the entry point.
 *
 * Markdown is parsed into an mdast tree so links, images, and definitions are
 * checked structurally. Link-looking text inside fenced code blocks is not a
 * reference and is therefore ignored. Absolute paths, fragments, protocol
 * URLs, and protocol-relative URLs are also outside this repository-relative
 * depth rule.
 *
 * Direct files such as `FORMS.md` and one-directory paths such as
 * `references/api.md` are accepted. Paths with more segments or any `..`
 * traversal are reported at the Markdown node's starting line.
 *
 * @see https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
 */
import { createSkillRule } from '../../create-skill-rule.ts';
import { collectLocalMarkdownReferences } from '../../markdown-references.ts';

export interface ReferenceDepthIssue {
	line: number;
	message: string;
}

/**
 * Oxlint rule that rejects relative skill references deeper than one
 * directory below SKILL.md.
 */
export const noDeepReferencesRule = createSkillRule(
	'Keep SKILL.md file references at most one directory deep.',
	(_filePath, source) => validateReferenceDepth(source),
);

export function validateReferenceDepth(source: string): ReferenceDepthIssue[] {
	return collectLocalMarkdownReferences(source)
		.filter(({ path }) => {
			const segments = path.split('/').filter((segment) => segment !== '' && segment !== '.');
			return segments.includes('..') || segments.length > 2;
		})
		.map(({ line, url }) => ({
			line,
			message: `Reference "${url}" is nested too deeply; link files at most one directory below SKILL.md.`,
		}));
}

if (import.meta.vitest) {
	test('accepts top-level and one-directory references', () => {
		const issues = validateReferenceDepth(
			'[Forms](FORMS.md)\n[API](references/api.md)\n[Script](scripts/validate.sh)\n',
		);

		expect(issues).toEqual([]);
	});

	test('reports references nested more than one directory deep', () => {
		const issues = validateReferenceDepth(
			'line 1\nline 2\nline 3\nline 4\nline 5\n[API](references/platform/api.md)\n',
		);

		expect(issues).toEqual([
			{
				line: 6,
				message:
					'Reference "references/platform/api.md" is nested too deeply; link files at most one directory below SKILL.md.',
			},
		]);
	});

	test('ignores external links and Markdown inside code blocks', () => {
		const issues = validateReferenceDepth(
			'[Specification](https://agentskills.io/specification)\n\n```markdown\n[Nested](references/platform/api.md)\n```\n',
		);

		expect(issues).toEqual([]);
	});
}
