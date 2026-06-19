import { createFixture } from 'fs-fixture';

import { validateOpenAiMetadata } from './index.ts';

test('stays silent when agents/openai.yaml is absent', async () => {
	await using fixture = await createFixture();

	expect(validateOpenAiMetadata(fixture.getPath('SKILL.md'))).toEqual([]);
});

test('accepts documented Codex metadata fields', async () => {
	await using fixture = await createFixture({
		'agents/openai.yaml': [
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
		'assets/icon.svg': '<svg></svg>\n',
	});

	expect(validateOpenAiMetadata(fixture.getPath('SKILL.md'))).toEqual([]);
});

test('reports malformed agents/openai.yaml', async () => {
	await using fixture = await createFixture({
		'agents/openai.yaml': 'interface: [\n',
	});

	expect(validateOpenAiMetadata(fixture.getPath('SKILL.md'))).toEqual([
		{
			line: 1,
			message: 'agents/openai.yaml must contain valid YAML.',
		},
	]);
});

test('validates documented field types and values', async () => {
	await using fixture = await createFixture({
		'agents/openai.yaml': [
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
	});

	expect(validateOpenAiMetadata(fixture.getPath('SKILL.md'))).toEqual([
		{ line: 1, message: 'interface.display_name must be a string.' },
		{ line: 1, message: 'interface.brand_color must be a hexadecimal colour.' },
		{ line: 1, message: 'policy.allow_implicit_invocation must be a boolean.' },
		{ line: 1, message: 'dependencies.tools[0].type must be "mcp".' },
		{ line: 1, message: 'dependencies.tools[0].value must be a non-empty string.' },
	]);
});

test('requires icon paths to resolve inside the skill directory', async () => {
	await using fixture = await createFixture({
		'outside.svg': '<svg></svg>\n',
		'skill/agents/openai.yaml': [
			'interface:',
			'  icon_small: "./assets/missing.svg"',
			'  icon_large: "../outside.svg"',
		].join('\n'),
	});

	expect(validateOpenAiMetadata(fixture.getPath('skill/SKILL.md'))).toEqual([
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
	await using fixture = await createFixture({
		'agents/openai.yaml': [
			'interface:',
			'  display_name: "Example"',
			'  future_field: true',
			'future_section: {}',
		].join('\n'),
	});

	expect(validateOpenAiMetadata(fixture.getPath('SKILL.md'))).toEqual([]);
	expect(validateOpenAiMetadata(fixture.getPath('SKILL.md'), '', { strict: true })).toEqual([
		{ line: 1, message: 'Unknown agents/openai.yaml field "future_section".' },
		{ line: 1, message: 'Unknown agents/openai.yaml field "interface.future_field".' },
	]);
});
