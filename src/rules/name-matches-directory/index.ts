/**
 * Implements `skills/name-matches-directory`.
 *
 * An Agent Skill is identified by both its containing directory and the
 * `name` field in SKILL.md frontmatter. Keeping those values identical avoids
 * ambiguous discovery results when a skill directory is copied, renamed, or
 * installed by another tool.
 *
 * The rule reuses the frontmatter parser from `valid-frontmatter` so quoted,
 * folded, and otherwise valid YAML names are compared as parsed values rather
 * than raw text. If frontmatter is missing or invalid, this rule stays silent;
 * `skills/valid-frontmatter` owns that diagnostic and prevents duplicate
 * errors for the same root cause.
 *
 * A mismatch is reported at the `name` field when its source line is
 * available. The expected value is the immediate parent directory of
 * SKILL.md, independent of which configured skill root contains it.
 *
 * @see https://agentskills.io/specification
 */
import { basename, dirname } from 'node:path';

import { createSkillRule } from '../../create-skill-rule.ts';
import { parseFrontmatter } from '../valid-frontmatter/index.ts';

export interface DirectoryNameIssue {
	line: number;
	message: string;
}

/**
 * Oxlint rule that requires each parsed skill name to equal its directory.
 */
export const nameMatchesDirectoryRule = createSkillRule(
	'Require the frontmatter name to match the skill directory.',
	validateDirectoryName,
);

export function validateDirectoryName(
	filePath: string,
	source: string,
): DirectoryNameIssue | undefined {
	const parsed = parseFrontmatter(source);
	const name = parsed.data?.name;

	if (typeof name !== 'string') {
		return undefined;
	}

	const directoryName = basename(dirname(filePath));

	if (name === directoryName) {
		return undefined;
	}

	const nameLineIndex = parsed.lines.findIndex((line) => line.startsWith('name:'));

	return {
		line: nameLineIndex === -1 ? 1 : nameLineIndex + 1,
		message: `Skill name "${name}" must match its parent directory "${directoryName}".`,
	};
}

if (import.meta.vitest) {
	test('accepts a name matching the skill directory', async () => {
		const fixture = await readFixture('./__fixture__/valid/reviewing-code/SKILL.md');
		const issue = validateDirectoryName(fixture.filePath, fixture.source);

		expect(issue).toBeUndefined();
	});

	test('reports a name that differs from the skill directory', async () => {
		const fixture = await readFixture(
			'./__fixture__/invalid/mismatched-name/reviewing-code/SKILL.md',
		);
		const issue = validateDirectoryName(fixture.filePath, fixture.source);

		expect(issue).toEqual({
			line: 2,
			message: 'Skill name "code-review" must match its parent directory "reviewing-code".',
		});
	});

	test('skips comparison when frontmatter is invalid', async () => {
		const fixture = await readFixture('./__fixture__/invalid/frontmatter/reviewing-code/SKILL.md');
		const issue = validateDirectoryName(fixture.filePath, fixture.source);

		expect(issue).toBeUndefined();
	});

	async function readFixture(path: string): Promise<{ filePath: string; source: string }> {
		const { readFile } = await import('node:fs/promises');
		const { fileURLToPath } = await import('node:url');
		const url = new URL(path, import.meta.url);

		return {
			filePath: fileURLToPath(url),
			source: await readFile(url, 'utf8'),
		};
	}
}
