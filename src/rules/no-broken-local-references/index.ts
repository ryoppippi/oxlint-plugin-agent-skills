import { dirname, resolve } from 'node:path';

import { createSkillRule } from '../../create-skill-rule.ts';
import { escapesDirectory, isFileInsideDirectory } from '../../file-paths.ts';
import { collectLocalMarkdownReferences } from '../../markdown-references.ts';

export interface LocalReferenceIssue {
	line: number;
	message: string;
}

export const noBrokenLocalReferencesRule = createSkillRule(
	'Require local SKILL.md references to resolve inside the skill directory.',
	validateLocalReferences,
);

export function validateLocalReferences(filePath: string, source: string): LocalReferenceIssue[] {
	const issues: LocalReferenceIssue[] = [];
	const skillDirectory = dirname(filePath);

	for (const { line, path, url } of collectLocalMarkdownReferences(source)) {
		const target = resolve(skillDirectory, path);

		if (escapesDirectory(skillDirectory, target)) {
			issues.push({
				line,
				message: `Reference "${url}" escapes the skill directory.`,
			});
		} else if (!isFileInsideDirectory(skillDirectory, target)) {
			issues.push({
				line,
				message: `Reference "${url}" does not resolve to a file in this skill.`,
			});
		}
	}

	return issues;
}

if (import.meta.vitest) {
	test('accepts existing local references with fragments', async () => {
		const { createFixture } = await import('fs-fixture');
		await using fixture = await createFixture({
			'references/guide.md': '# Guide\n',
		});

		expect(
			validateLocalReferences(
				fixture.getPath('SKILL.md'),
				'Read [the guide](references/guide.md#usage).\n',
			),
		).toEqual([]);
	});

	test('reports missing local references at their source line', async () => {
		const { createFixture } = await import('fs-fixture');
		await using fixture = await createFixture();

		expect(
			validateLocalReferences(
				fixture.getPath('SKILL.md'),
				'# Instructions\n\nRead [the guide](references/missing.md).\n',
			),
		).toEqual([
			{
				line: 3,
				message: 'Reference "references/missing.md" does not resolve to a file in this skill.',
			},
		]);
	});

	test('rejects references that escape the skill directory', async () => {
		const { createFixture } = await import('fs-fixture');
		await using fixture = await createFixture({
			'outside.md': '# Outside\n',
			skill: {},
		});

		expect(
			validateLocalReferences(
				fixture.getPath('skill/SKILL.md'),
				'Read [outside](../outside.md).\n',
			),
		).toEqual([
			{
				line: 1,
				message: 'Reference "../outside.md" escapes the skill directory.',
			},
		]);
	});

	test('ignores external links, fragments, and link examples in code blocks', async () => {
		const { createFixture } = await import('fs-fixture');
		await using fixture = await createFixture();
		const source =
			'[site](https://example.com) [section](#section)\n\n```markdown\n[example](missing.md)\n```\n';

		expect(validateLocalReferences(fixture.getPath('SKILL.md'), source)).toEqual([]);
	});

	test('validates image and definition targets', async () => {
		const { createFixture } = await import('fs-fixture');
		await using fixture = await createFixture();

		expect(
			validateLocalReferences(
				fixture.getPath('SKILL.md'),
				'![missing](assets/missing.png)\n\n[guide]: references/missing.md\n',
			),
		).toEqual([
			{
				line: 1,
				message: 'Reference "assets/missing.png" does not resolve to a file in this skill.',
			},
			{
				line: 3,
				message: 'Reference "references/missing.md" does not resolve to a file in this skill.',
			},
		]);
	});
}
