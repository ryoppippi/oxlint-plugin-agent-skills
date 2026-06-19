import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { validateLocalReferences } from './index.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

test('accepts existing local references with fragments', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'references'));
	await writeFile(join(directory, 'references/guide.md'), '# Guide\n');

	expect(
		validateLocalReferences(
			join(directory, 'SKILL.md'),
			'Read [the guide](references/guide.md#usage).\n',
		),
	).toEqual([]);
});

test('reports missing local references at their source line', async () => {
	const directory = await createTemporaryDirectory();

	expect(
		validateLocalReferences(
			join(directory, 'SKILL.md'),
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
	const parent = await createTemporaryDirectory();
	const directory = join(parent, 'skill');
	await mkdir(directory);
	await writeFile(join(parent, 'outside.md'), '# Outside\n');

	expect(
		validateLocalReferences(join(directory, 'SKILL.md'), 'Read [outside](../outside.md).\n'),
	).toEqual([
		{
			line: 1,
			message: 'Reference "../outside.md" escapes the skill directory.',
		},
	]);
});

test('ignores external links, fragments, and link examples in code blocks', async () => {
	const directory = await createTemporaryDirectory();
	const source =
		'[site](https://example.com) [section](#section)\n\n```markdown\n[example](missing.md)\n```\n';

	expect(validateLocalReferences(join(directory, 'SKILL.md'), source)).toEqual([]);
});

test('validates image and definition targets', async () => {
	const directory = await createTemporaryDirectory();

	expect(
		validateLocalReferences(
			join(directory, 'SKILL.md'),
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

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), 'skill-references-'));
	temporaryDirectories.push(directory);
	return directory;
}
