/**
 * Creates repository-scoped Agent Skill rules.
 *
 * Oxlint JavaScript plugins receive JavaScript and TypeScript ASTs, not
 * Markdown documents. A skill rule therefore uses the first visited Program
 * as an execution anchor, discovers SKILL.md files under configured roots,
 * validates their source, and reports each issue through Oxlint.
 *
 * Every diagnostic message begins with the repository-relative SKILL.md path
 * and its real Markdown line. Oxlint still attaches the diagnostic to the
 * JavaScript or TypeScript anchor because plugin rules cannot create AST nodes
 * for files that Oxlint did not parse.
 *
 * The content signature cache prevents the same repository-wide findings from
 * being emitted once per JavaScript or TypeScript file. A changed SKILL.md
 * produces a new signature and is validated again in long-running processes.
 *
 * Rule options accept `{ roots: string[] }`. When omitted, rules scan the
 * standard Agent Skill locations `.agents/skills`, `agents/skills`, and
 * `skills`, relative to Oxlint's working directory.
 */
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

import { defineRule } from '@oxlint/plugins';

export interface SkillIssue {
	line: number;
	message: string;
}

export interface DiscoveredSkill {
	displayPath: string;
	filePath: string;
	source: string;
}

export interface AggregateSkillIssue {
	filePath: string;
	line: number;
	message: string;
}

export type SkillValidator = (
	filePath: string,
	source: string,
	option: unknown,
) => SkillIssue | readonly SkillIssue[] | undefined;

export type AggregateSkillValidator = (
	skills: readonly DiscoveredSkill[],
	option: unknown,
) => readonly AggregateSkillIssue[];

export const DEFAULT_SKILL_ROOTS = [
	'.agent/skills',
	'.agents/skills',
	'agents/skills',
	'skills',
] as const;

const ROOTS_OPTION_SCHEMA = {
	items: {
		minLength: 1,
		type: 'string',
	},
	minItems: 1,
	type: 'array',
	uniqueItems: true,
} as const;

interface IntegerOptionSchema {
	minimum?: number;
	type: 'integer';
}

interface BooleanOptionSchema {
	type: 'boolean';
}

type SkillRuleOptionSchema = BooleanOptionSchema | IntegerOptionSchema | typeof ROOTS_OPTION_SCHEMA;

/**
 * Builds an Oxlint rule whose validator sees every discovered skill at once.
 *
 * This is the shared core behind both factories. The per-file
 * {@link createSkillRule} adapts its validator onto this contract, while
 * {@link createAggregateSkillRule} forwards a validator straight through so it
 * can reason about relationships between skills (for example, duplicate names).
 *
 * Each emitted issue carries its own `filePath`, so a single Program pass can
 * report findings against many different SKILL.md files.
 */
function createRule(
	description: string,
	validate: AggregateSkillValidator,
	optionProperties: Readonly<Record<string, SkillRuleOptionSchema>>,
	recommended: boolean,
) {
	const signatures = new Map<string, string>();

	return defineRule({
		meta: {
			docs: {
				description,
				recommended,
			},
			schema: [
				{
					additionalProperties: false,
					properties: {
						roots: ROOTS_OPTION_SCHEMA,
						...optionProperties,
					},
					type: 'object',
				},
			],
			type: 'problem',
		},
		create(context) {
			return {
				Program(node) {
					const option = context.options[0];
					const roots = readRoots(option);
					const cacheKey = `${context.cwd}\0${JSON.stringify(option)}\0${roots.join('\0')}`;
					const skillFiles = discoverSkillFiles(context.cwd, roots);
					const skills: DiscoveredSkill[] = skillFiles.map((filePath) => ({
						displayPath: displayPath(context.cwd, filePath),
						filePath,
						source: readFileSync(filePath, 'utf8'),
					}));
					const signature = skills
						.map(({ filePath, source }) => `${filePath}\0${source}`)
						.join('\0');

					if (signatures.get(cacheKey) === signature) {
						return;
					}

					signatures.set(cacheKey, signature);

					for (const issue of validate(skills, option)) {
						context.report({
							message: `${displayPath(context.cwd, issue.filePath)}:${issue.line} ${issue.message}`,
							node,
						});
					}
				},
			};
		},
	});
}

/**
 * Creates a repository-scoped rule that validates each SKILL.md independently.
 *
 * Pass `recommended: false` for opt-in rules that should stay out of the
 * recommended preset (for example, stricter checks that diverge from this
 * plugin's default leniency).
 */
export function createSkillRule(
	description: string,
	validate: SkillValidator,
	optionProperties: Readonly<Record<string, SkillRuleOptionSchema>> = {},
	recommended = true,
) {
	return createRule(
		description,
		(skills, option) => {
			const issues: AggregateSkillIssue[] = [];

			for (const skill of skills) {
				const result = validate(skill.filePath, skill.source, option);
				const found: readonly SkillIssue[] =
					result === undefined ? [] : Array.isArray(result) ? result : [result];

				for (const issue of found) {
					issues.push({ filePath: skill.filePath, line: issue.line, message: issue.message });
				}
			}

			return issues;
		},
		optionProperties,
		recommended,
	);
}

/**
 * Creates a repository-scoped rule that validates all discovered skills
 * together, enabling checks that depend on more than one SKILL.md.
 */
export function createAggregateSkillRule(
	description: string,
	validate: AggregateSkillValidator,
	optionProperties: Readonly<Record<string, SkillRuleOptionSchema>> = {},
	recommended = true,
) {
	return createRule(description, validate, optionProperties, recommended);
}

export function discoverSkillFiles(
	cwd: string,
	roots: readonly string[] = DEFAULT_SKILL_ROOTS,
): string[] {
	const skillFiles: string[] = [];
	const visitedDirectories = new Set<string>();
	const visitedFiles = new Set<string>();

	for (const root of roots) {
		visitDirectory(resolve(cwd, root), skillFiles, visitedDirectories, visitedFiles);
	}

	return skillFiles.toSorted();
}

function readRoots(option: unknown): readonly string[] {
	if (
		typeof option === 'object' &&
		option !== null &&
		'roots' in option &&
		Array.isArray(option.roots) &&
		option.roots.every((root) => typeof root === 'string')
	) {
		return option.roots;
	}

	return DEFAULT_SKILL_ROOTS;
}

function displayPath(cwd: string, filePath: string): string {
	return relative(cwd, filePath).split(sep).join('/');
}

function visitDirectory(
	directory: string,
	skillFiles: string[],
	visitedDirectories: Set<string>,
	visitedFiles: Set<string>,
): void {
	let entries;
	let realDirectory;

	try {
		realDirectory = realpathSync(directory);

		if (visitedDirectories.has(realDirectory)) {
			return;
		}

		visitedDirectories.add(realDirectory);
		entries = readdirSync(directory, { withFileTypes: true });
	} catch (error) {
		if (isMissingDirectoryError(error)) {
			return;
		}

		throw error;
	}

	for (const entry of entries) {
		const path = join(directory, entry.name);
		let isDirectory = entry.isDirectory();
		let isFile = entry.isFile();

		if (entry.isSymbolicLink()) {
			try {
				const target = statSync(path);
				isDirectory = target.isDirectory();
				isFile = target.isFile();
			} catch (error) {
				if (isMissingDirectoryError(error)) {
					continue;
				}

				throw error;
			}
		}

		if (isDirectory) {
			visitDirectory(path, skillFiles, visitedDirectories, visitedFiles);
		} else if (isFile && entry.name === 'SKILL.md') {
			const realFile = realpathSync(path);

			if (!visitedFiles.has(realFile)) {
				visitedFiles.add(realFile);
				skillFiles.push(path);
			}
		}
	}
}

function isMissingDirectoryError(error: unknown): boolean {
	return (
		error instanceof Error &&
		'code' in error &&
		(error.code === 'ENOENT' || error.code === 'ENOTDIR')
	);
}

if (import.meta.vitest) {
	test('finds SKILL.md files in the standard skill roots', async () => {
		const { fileURLToPath } = await import('node:url');
		const cwd = fileURLToPath(new URL('./__fixture__/discovery', import.meta.url));

		expect(discoverSkillFiles(cwd)).toEqual([
			join(cwd, '.agent/skills/formatting/SKILL.md'),
			join(cwd, '.agents/skills/commit/SKILL.md'),
			join(cwd, 'agents/skills/testing/SKILL.md'),
		]);
	});

	test('follows symlinked skill directories', async () => {
		const { createFixture } = await import('fs-fixture');
		await using fixture = await createFixture({
			'.agents/skills/example': (ctx) => ctx.symlink(ctx.getPath('shared/example')),
			'shared/example/SKILL.md': '# Example\n',
		});

		expect(discoverSkillFiles(fixture.path)).toEqual([
			fixture.getPath('.agents/skills/example/SKILL.md'),
		]);
	});

	test('deduplicates files discovered through overlapping roots', async () => {
		const { createFixture } = await import('fs-fixture');
		await using fixture = await createFixture({
			'skills/example/SKILL.md': '# Example\n',
		});

		expect(discoverSkillFiles(fixture.path, ['skills', 'skills/example'])).toEqual([
			fixture.getPath('skills/example/SKILL.md'),
		]);
	});

	test('does not recurse forever through symlink cycles', async () => {
		const { createFixture } = await import('fs-fixture');
		await using fixture = await createFixture({
			'skills/example/cycle': (ctx) => ctx.symlink(ctx.getPath('skills')),
			'skills/example/SKILL.md': '# Example\n',
		});

		expect(discoverSkillFiles(fixture.path, ['skills'])).toEqual([
			fixture.getPath('skills/example/SKILL.md'),
		]);
	});

	test('ignores broken symlinks while scanning skills', async () => {
		const { createFixture } = await import('fs-fixture');
		await using fixture = await createFixture({
			'skills/broken': (ctx) => ctx.symlink(ctx.getPath('missing')),
		});

		expect(discoverSkillFiles(fixture.path, ['skills'])).toEqual([]);
	});
}
