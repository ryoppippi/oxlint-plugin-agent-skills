import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';

import { defineRule } from '@oxlint/plugins';

import { validateFrontmatter } from './frontmatter.ts';
import { validateSkillLength } from './length.ts';
import { validateDirectoryName } from './name.ts';
import { validateReferenceDepth } from './references.ts';
import { DEFAULT_SKILL_ROOTS, discoverSkillFiles } from './skills.ts';

interface SkillIssue {
	line: number;
	message: string;
}

type SkillValidator = (
	filePath: string,
	source: string,
) => SkillIssue | readonly SkillIssue[] | undefined;

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

export const validFrontmatterRule = createSkillRule(
	'Validate Agent Skill YAML frontmatter.',
	(_filePath, source) => validateFrontmatter(source),
);

export const nameMatchesDirectoryRule = createSkillRule(
	'Require the frontmatter name to match the skill directory.',
	validateDirectoryName,
);

export const maxSkillLinesRule = createSkillRule(
	'Limit SKILL.md instructions to 500 lines.',
	(_filePath, source) => validateSkillLength(source),
);

export const noDeepReferencesRule = createSkillRule(
	'Keep SKILL.md file references at most one directory deep.',
	(_filePath, source) => validateReferenceDepth(source),
);

function createSkillRule(description: string, validate: SkillValidator) {
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
