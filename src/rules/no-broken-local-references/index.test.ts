import { createFixture } from 'fs-fixture';

import { validateLocalReferences } from './index.ts';

test('accepts existing local references with fragments', async () => {
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
	await using fixture = await createFixture({
		'outside.md': '# Outside\n',
		skill: {},
	});

	expect(
		validateLocalReferences(fixture.getPath('skill/SKILL.md'), 'Read [outside](../outside.md).\n'),
	).toEqual([
		{
			line: 1,
			message: 'Reference "../outside.md" escapes the skill directory.',
		},
	]);
});

test('ignores external links, fragments, and link examples in code blocks', async () => {
	await using fixture = await createFixture();
	const source =
		'[site](https://example.com) [section](#section)\n\n```markdown\n[example](missing.md)\n```\n';

	expect(validateLocalReferences(fixture.getPath('SKILL.md'), source)).toEqual([]);
});

test('validates image and definition targets', async () => {
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
