/**
 * Implements `skills/no-unknown-frontmatter-fields`.
 *
 * The Agent Skills reference validator (`skills-ref`) rejects any frontmatter
 * field outside the specified set, catching typos such as `descriptions:` that
 * an agent would silently ignore. This plugin is lenient by default — it allows
 * extension fields like `paths` or `globs` — so this strict check is opt-in and
 * excluded from the recommended preset. Enable it when a repository wants its
 * SKILL.md frontmatter to match the specification exactly.
 *
 * Only the top-level keys are checked; `metadata` remains the open extension
 * point for arbitrary custom data. The rule stays silent when frontmatter is
 * missing or invalid, leaving that to `skills/valid-frontmatter`.
 *
 * @see https://github.com/agentskills/agentskills/tree/main/skills-ref
 * @see https://agentskills.io/specification
 */
import { createSkillRule } from '../../create-skill-rule.ts';
import { parseFrontmatter } from '../valid-frontmatter/index.ts';

export interface UnknownFieldIssue {
	line: number;
	message: string;
}

/** Top-level frontmatter fields defined by the Agent Skills specification. */
export const ALLOWED_FRONTMATTER_FIELDS: ReadonlySet<string> = new Set([
	'allowed-tools',
	'compatibility',
	'description',
	'license',
	'metadata',
	'name',
]);

/**
 * Oxlint rule that rejects frontmatter fields outside the specification.
 *
 * Opt-in: excluded from the recommended preset because this plugin otherwise
 * permits extension fields.
 */
export const noUnknownFrontmatterFieldsRule = createSkillRule(
	'Reject SKILL.md frontmatter fields outside the Agent Skills specification.',
	(_filePath, source) => validateKnownFields(source),
	{},
	false,
);

export function validateKnownFields(source: string): UnknownFieldIssue[] {
	const parsed = parseFrontmatter(source);

	// Missing/invalid frontmatter is reported by valid-frontmatter.
	if (parsed.data === undefined) {
		return [];
	}

	const issues: UnknownFieldIssue[] = [];

	// Report each unknown key in document order at its own line.
	for (const key of Object.keys(parsed.data)) {
		if (ALLOWED_FRONTMATTER_FIELDS.has(key)) {
			continue;
		}

		const keyLineIndex = parsed.lines.findIndex((line) => line.startsWith(`${key}:`));

		issues.push({
			line: keyLineIndex === -1 ? 1 : keyLineIndex + 1,
			message: `Frontmatter field "${key}" is not part of the Agent Skills specification; remove it or move it under metadata.`,
		});
	}

	return issues;
}

if (import.meta.vitest) {
	test('accepts only specified fields', async () => {
		expect(validateKnownFields(await readFixture('./__fixture__/valid/SKILL.md'))).toEqual([]);
	});

	test('reports an unknown field at its line', async () => {
		expect(validateKnownFields(await readFixture('./__fixture__/invalid/SKILL.md'))).toEqual([
			{
				line: 4,
				message:
					'Frontmatter field "descriptions" is not part of the Agent Skills specification; remove it or move it under metadata.',
			},
		]);
	});

	test('stays silent when frontmatter is invalid', () => {
		expect(validateKnownFields('# No frontmatter here\n')).toEqual([]);
	});

	async function readFixture(path: string): Promise<string> {
		const { readFile } = await import('node:fs/promises');
		return readFile(new URL(path, import.meta.url), 'utf8');
	}
}
