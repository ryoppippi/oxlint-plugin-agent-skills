/**
 * Implements `skills/no-duplicate-skill-name`.
 *
 * An Agent Skill is invoked by its `name`. When two SKILL.md files under the
 * configured roots declare the same name, the agent cannot reliably tell them
 * apart: discovery, activation, and tool routing all key off the name, so one
 * skill silently shadows the other. This rule reports every SKILL.md that
 * shares its name with another skill, naming the files it collides with.
 *
 * Names are read through the `valid-frontmatter` parser so quoted and folded
 * YAML names compare as parsed values rather than raw text. Files with missing
 * or invalid frontmatter, or without a string `name`, are ignored here;
 * `skills/valid-frontmatter` owns those diagnostics and prevents duplicate
 * errors for the same root cause.
 *
 * Unlike the per-file rules, this one inspects every discovered skill at once,
 * so it relies on `createAggregateSkillRule`.
 *
 * @see https://agentskills.io/specification
 */
import type { AggregateSkillIssue, DiscoveredSkill } from '../../create-skill-rule.ts';

import { createAggregateSkillRule } from '../../create-skill-rule.ts';
import { parseFrontmatter } from '../valid-frontmatter/index.ts';

interface NamedSkill {
	displayPath: string;
	filePath: string;
	line: number;
}

/**
 * Oxlint rule that requires each skill name to be unique across all roots.
 */
export const noDuplicateSkillNameRule = createAggregateSkillRule(
	'Require each skill name to be unique across configured roots.',
	validateUniqueSkillNames,
);

export function validateUniqueSkillNames(
	skills: readonly DiscoveredSkill[],
): AggregateSkillIssue[] {
	// Group every skill that declares a non-empty string name by that name.
	// Skills are already sorted by file path, so groups and their members keep
	// a deterministic order.
	const skillsByName = new Map<string, NamedSkill[]>();

	for (const skill of skills) {
		const parsed = parseFrontmatter(skill.source);
		const name = parsed.data?.name;

		if (typeof name !== 'string' || name.length === 0) {
			continue;
		}

		const nameLineIndex = parsed.lines.findIndex((line) => line.startsWith('name:'));
		const occurrences = skillsByName.get(name) ?? [];

		occurrences.push({
			displayPath: skill.displayPath,
			filePath: skill.filePath,
			line: nameLineIndex === -1 ? 1 : nameLineIndex + 1,
		});
		skillsByName.set(name, occurrences);
	}

	const issues: AggregateSkillIssue[] = [];

	// Any name claimed by more than one skill is a collision. Report each
	// member at its own `name` line, listing the other files it conflicts with.
	for (const [name, occurrences] of skillsByName) {
		if (occurrences.length < 2) {
			continue;
		}

		for (const occurrence of occurrences) {
			const others = occurrences
				.filter((other) => other !== occurrence)
				.map((other) => other.displayPath);

			issues.push({
				filePath: occurrence.filePath,
				line: occurrence.line,
				message: `Skill name "${name}" is also declared in ${others.join(', ')}; skill names must be unique.`,
			});
		}
	}

	return issues;
}

if (import.meta.vitest) {
	test('accepts skills with unique names', async () => {
		const skills = await loadSkills([
			{ displayPath: 'skills/commit/SKILL.md', fixture: './__fixture__/valid/commit/SKILL.md' },
			{ displayPath: 'skills/review/SKILL.md', fixture: './__fixture__/valid/review/SKILL.md' },
		]);

		expect(validateUniqueSkillNames(skills)).toEqual([]);
	});

	test('reports every skill that shares a name', async () => {
		const skills = await loadSkills([
			{
				displayPath: 'a/code-review/SKILL.md',
				fixture: './__fixture__/invalid/a/code-review/SKILL.md',
			},
			{
				displayPath: 'b/code-review/SKILL.md',
				fixture: './__fixture__/invalid/b/code-review/SKILL.md',
			},
		]);

		expect(validateUniqueSkillNames(skills)).toEqual([
			{
				filePath: skills[0]?.filePath,
				line: 2,
				message:
					'Skill name "code-review" is also declared in b/code-review/SKILL.md; skill names must be unique.',
			},
			{
				filePath: skills[1]?.filePath,
				line: 2,
				message:
					'Skill name "code-review" is also declared in a/code-review/SKILL.md; skill names must be unique.',
			},
		]);
	});

	test('ignores a name that only appears once', async () => {
		const skills = await loadSkills([
			{
				displayPath: 'a/code-review/SKILL.md',
				fixture: './__fixture__/invalid/a/code-review/SKILL.md',
			},
			{ displayPath: 'skills/review/SKILL.md', fixture: './__fixture__/valid/review/SKILL.md' },
		]);

		expect(validateUniqueSkillNames(skills)).toEqual([]);
	});

	async function loadSkills(
		entries: readonly { displayPath: string; fixture: string }[],
	): Promise<DiscoveredSkill[]> {
		const { readFile } = await import('node:fs/promises');
		const { fileURLToPath } = await import('node:url');

		return Promise.all(
			entries.map(async ({ displayPath, fixture }) => {
				const url = new URL(fixture, import.meta.url);

				return {
					displayPath,
					filePath: fileURLToPath(url),
					source: await readFile(url, 'utf8'),
				};
			}),
		);
	}
}
