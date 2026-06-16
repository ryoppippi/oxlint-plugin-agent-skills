/**
 * Shared infrastructure for repository-scoped Agent Skill rules.
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
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

import { defineRule } from '@oxlint/plugins';

export interface SkillIssue {
	line: number;
	message: string;
}

export type SkillValidator = (
	filePath: string,
	source: string,
) => SkillIssue | readonly SkillIssue[] | undefined;

export const DEFAULT_SKILL_ROOTS = ['.agents/skills', 'agents/skills', 'skills'] as const;

const ROOT_OPTIONS_SCHEMA = [
	{
		additionalProperties: false,
		properties: {
			roots: {
				items: {
					minLength: 1,
					type: 'string',
				},
				minItems: 1,
				type: 'array',
				uniqueItems: true,
			},
		},
		type: 'object',
	},
] as const;

export function createSkillRule(description: string, validate: SkillValidator) {
	const signatures = new Map<string, string>();

	return defineRule({
		meta: {
			docs: {
				description,
				recommended: true,
			},
			schema: ROOT_OPTIONS_SCHEMA,
			type: 'problem',
		},
		create(context) {
			return {
				Program(node) {
					const roots = readRoots(context.options[0]);
					const cacheKey = `${context.cwd}\0${roots.join('\0')}`;
					const skillFiles = discoverSkillFiles(context.cwd, roots);
					const skills = skillFiles.map((filePath) => ({
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

					for (const skill of skills) {
						const result = validate(skill.filePath, skill.source);
						const issues = result === undefined ? [] : Array.isArray(result) ? result : [result];

						for (const issue of issues) {
							context.report({
								message: `${displayPath(context.cwd, skill.filePath)}:${issue.line} ${issue.message}`,
								node,
							});
						}
					}
				},
			};
		},
	});
}

export function discoverSkillFiles(
	cwd: string,
	roots: readonly string[] = DEFAULT_SKILL_ROOTS,
): string[] {
	const skillFiles: string[] = [];

	for (const root of roots) {
		visitDirectory(resolve(cwd, root), skillFiles);
	}

	return skillFiles.sort();
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

function visitDirectory(directory: string, skillFiles: string[]): void {
	let entries;

	try {
		entries = readdirSync(directory, { withFileTypes: true });
	} catch (error) {
		if (isMissingDirectoryError(error)) {
			return;
		}

		throw error;
	}

	for (const entry of entries) {
		const path = join(directory, entry.name);

		if (entry.isDirectory()) {
			visitDirectory(path, skillFiles);
		} else if (entry.isFile() && entry.name === 'SKILL.md') {
			skillFiles.push(path);
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
