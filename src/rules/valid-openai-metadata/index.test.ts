import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { validateOpenAiMetadata } from './index.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

test('stays silent when agents/openai.yaml is absent', async () => {
	const directory = await createTemporaryDirectory();

	expect(validateOpenAiMetadata(join(directory, 'SKILL.md'))).toEqual([]);
});

test('accepts documented Codex metadata fields', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'agents'));
	await mkdir(join(directory, 'assets'));
	await writeFile(join(directory, 'assets/icon.svg'), '<svg></svg>\n');
	await writeFile(
		join(directory, 'agents/openai.yaml'),
		[
			'interface:',
			'  display_name: "Example"',
			'  short_description: "Runs the example workflow"',
			'  icon_small: "./assets/icon.svg"',
			'  icon_large: "./assets/icon.svg"',
			'  brand_color: "#3B82F6"',
			'  default_prompt: "Use $example to run the workflow."',
			'policy:',
			'  allow_implicit_invocation: false',
			'dependencies:',
			'  tools:',
			'    - type: "mcp"',
			'      value: "example"',
			'      description: "Example MCP server"',
			'      transport: "streamable_http"',
			'      url: "https://example.com/mcp"',
		].join('\n'),
	);

	expect(validateOpenAiMetadata(join(directory, 'SKILL.md'))).toEqual([]);
});

test('reports malformed agents/openai.yaml', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'agents'));
	await writeFile(join(directory, 'agents/openai.yaml'), 'interface: [\n');

	expect(validateOpenAiMetadata(join(directory, 'SKILL.md'))).toEqual([
		{
			line: 1,
			message: 'agents/openai.yaml must contain valid YAML.',
		},
	]);
});

test('validates documented field types and values', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'agents'));
	await writeFile(
		join(directory, 'agents/openai.yaml'),
		[
			'interface:',
			'  display_name: 42',
			'  brand_color: blue',
			'policy:',
			'  allow_implicit_invocation: "yes"',
			'dependencies:',
			'  tools:',
			'    - type: shell',
			'      value: 42',
		].join('\n'),
	);

	expect(validateOpenAiMetadata(join(directory, 'SKILL.md'))).toEqual([
		{ line: 1, message: 'interface.display_name must be a string.' },
		{ line: 1, message: 'interface.brand_color must be a hexadecimal colour.' },
		{ line: 1, message: 'policy.allow_implicit_invocation must be a boolean.' },
		{ line: 1, message: 'dependencies.tools[0].type must be "mcp".' },
		{ line: 1, message: 'dependencies.tools[0].value must be a non-empty string.' },
	]);
});

test('requires icon paths to resolve inside the skill directory', async () => {
	const parent = await createTemporaryDirectory();
	const directory = join(parent, 'skill');
	await mkdir(join(directory, 'agents'), { recursive: true });
	await writeFile(join(parent, 'outside.svg'), '<svg></svg>\n');
	await writeFile(
		join(directory, 'agents/openai.yaml'),
		['interface:', '  icon_small: "./assets/missing.svg"', '  icon_large: "../outside.svg"'].join(
			'\n',
		),
	);

	expect(validateOpenAiMetadata(join(directory, 'SKILL.md'))).toEqual([
		{
			line: 1,
			message: 'interface.icon_small must resolve to a file inside the skill directory.',
		},
		{
			line: 1,
			message: 'interface.icon_large must resolve to a file inside the skill directory.',
		},
	]);
});

test('tolerates unknown fields unless strict mode is enabled', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'agents'));
	await writeFile(
		join(directory, 'agents/openai.yaml'),
		['interface:', '  display_name: "Example"', '  future_field: true', 'future_section: {}'].join(
			'\n',
		),
	);

	expect(validateOpenAiMetadata(join(directory, 'SKILL.md'))).toEqual([]);
	expect(validateOpenAiMetadata(join(directory, 'SKILL.md'), '', { strict: true })).toEqual([
		{ line: 1, message: 'Unknown agents/openai.yaml field "future_section".' },
		{ line: 1, message: 'Unknown agents/openai.yaml field "interface.future_field".' },
	]);
});

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), 'skill-openai-metadata-'));
	temporaryDirectories.push(directory);
	return directory;
}
