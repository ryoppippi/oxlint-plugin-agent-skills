import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { validateReferenceTablesOfContents } from './index.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

test('reports a long referenced Markdown file without a table of contents', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'references'));
	await writeFile(join(directory, 'references/guide.md'), Array(101).fill('content').join('\n'));

	expect(
		validateReferenceTablesOfContents(
			join(directory, 'SKILL.md'),
			'Read [the guide](references/guide.md).\n',
		),
	).toEqual([
		{
			line: 1,
			message:
				'Reference "references/guide.md" has 101 lines; add a table of contents near the top.',
		},
	]);
});

test('accepts a long reference with a linked table of contents near the top', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'references'));
	await writeFile(
		join(directory, 'references/guide.md'),
		['# Guide', '', '- [Usage](#usage)', '', '## Usage', ...Array(96).fill('content')].join('\n'),
	);

	expect(
		validateReferenceTablesOfContents(
			join(directory, 'SKILL.md'),
			'Read [the guide](references/guide.md).\n',
		),
	).toEqual([]);
});

test('accepts a reference at the configured line threshold', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'references'));
	await writeFile(join(directory, 'references/guide.md'), ['one', 'two'].join('\n'));

	expect(
		validateReferenceTablesOfContents(
			join(directory, 'SKILL.md'),
			'Read [the guide](references/guide.md).\n',
			{ maxLines: 2 },
		),
	).toEqual([]);
});

test('does not count a trailing newline as an extra line', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'references'));
	await writeFile(
		join(directory, 'references/guide.md'),
		`${Array(100).fill('content').join('\n')}\n`,
	);

	expect(
		validateReferenceTablesOfContents(
			join(directory, 'SKILL.md'),
			'Read [the guide](references/guide.md).\n',
		),
	).toEqual([]);
});

test('uses a configured line threshold', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'references'));
	await writeFile(join(directory, 'references/guide.txt'), ['one', 'two', 'three'].join('\n'));

	expect(
		validateReferenceTablesOfContents(
			join(directory, 'SKILL.md'),
			'Read [the guide](references/guide.txt).\n',
			{ maxLines: 2 },
		),
	).toHaveLength(1);
});

test('ignores missing references and non-text assets', async () => {
	const directory = await createTemporaryDirectory();

	expect(
		validateReferenceTablesOfContents(
			join(directory, 'SKILL.md'),
			'[missing](references/missing.md) ![image](assets/image.png)\n',
		),
	).toEqual([]);
});

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), 'skill-reference-toc-'));
	temporaryDirectories.push(directory);
	return directory;
}
