import { createFixture } from 'fs-fixture';

import { validateReferenceTablesOfContents } from './index.ts';

test('reports a long referenced Markdown file without a table of contents', async () => {
	await using fixture = await createFixture({
		'references/guide.md': Array(101).fill('content').join('\n'),
	});

	expect(
		validateReferenceTablesOfContents(
			fixture.getPath('SKILL.md'),
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
	await using fixture = await createFixture({
		'references/guide.md': [
			'# Guide',
			'',
			'- [Usage](#usage)',
			'',
			'## Usage',
			...Array(96).fill('content'),
		].join('\n'),
	});

	expect(
		validateReferenceTablesOfContents(
			fixture.getPath('SKILL.md'),
			'Read [the guide](references/guide.md).\n',
		),
	).toEqual([]);
});

test('accepts a reference at the configured line threshold', async () => {
	await using fixture = await createFixture({
		'references/guide.md': ['one', 'two'].join('\n'),
	});

	expect(
		validateReferenceTablesOfContents(
			fixture.getPath('SKILL.md'),
			'Read [the guide](references/guide.md).\n',
			{ maxLines: 2 },
		),
	).toEqual([]);
});

test('does not count a trailing newline as an extra line', async () => {
	await using fixture = await createFixture({
		'references/guide.md': `${Array(100).fill('content').join('\n')}\n`,
	});

	expect(
		validateReferenceTablesOfContents(
			fixture.getPath('SKILL.md'),
			'Read [the guide](references/guide.md).\n',
		),
	).toEqual([]);
});

test('uses a configured line threshold', async () => {
	await using fixture = await createFixture({
		'references/guide.txt': ['one', 'two', 'three'].join('\n'),
	});

	expect(
		validateReferenceTablesOfContents(
			fixture.getPath('SKILL.md'),
			'Read [the guide](references/guide.txt).\n',
			{ maxLines: 2 },
		),
	).toHaveLength(1);
});

test('ignores missing references and non-text assets', async () => {
	await using fixture = await createFixture();

	expect(
		validateReferenceTablesOfContents(
			fixture.getPath('SKILL.md'),
			'[missing](references/missing.md) ![image](assets/image.png)\n',
		),
	).toEqual([]);
});
