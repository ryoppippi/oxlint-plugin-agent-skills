import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { afterEach, describe, expect, it } from 'vitest';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

describe('Oxlint integration', () => {
	it('reports Agent Skill violations through JavaScript plugin rules', async () => {
		const cwd = await mkdtemp(join(tmpdir(), 'oxlint-plugin-skills-'));
		temporaryDirectories.push(cwd);
		await mkdir(join(cwd, '.agents/skills/demo'), { recursive: true });
		await writeFile(join(cwd, 'anchor.js'), 'const anchor = 1;\n');
		await writeFile(
			join(cwd, '.agents/skills/demo/SKILL.md'),
			[
				'---',
				'name: other',
				'---',
				'',
				'[Deep reference](references/platform/api.md)',
				...Array.from({ length: 496 }, () => 'line'),
			].join('\n'),
		);
		await writeFile(
			join(cwd, '.oxlintrc.json'),
			JSON.stringify({
				categories: { correctness: 'off' },
				jsPlugins: [resolve('dist/index.js')],
				rules: {
					'skills/max-skill-lines': 'error',
					'skills/name-matches-directory': 'error',
					'skills/no-deep-references': 'error',
					'skills/valid-frontmatter': 'error',
				},
			}),
		);

		const result = spawnSync(
			process.execPath,
			[
				resolve('node_modules/oxlint/bin/oxlint'),
				'--config',
				'.oxlintrc.json',
				'anchor.js',
				'--format',
				'unix',
			],
			{ cwd, encoding: 'utf8' },
		);
		const output = `${result.stdout}${result.stderr}`;

		expect(result.status).toBe(1);
		expect(output).toContain('[Error/skills(valid-frontmatter)]');
		expect(output).toContain('[Error/skills(name-matches-directory)]');
		expect(output).toContain('[Error/skills(max-skill-lines)]');
		expect(output).toContain('[Error/skills(no-deep-references)]');
		expect(output).toContain('.agents/skills/demo/SKILL.md');
	});

	it('scans configured skill roots', async () => {
		const cwd = await mkdtemp(join(tmpdir(), 'oxlint-plugin-skills-'));
		temporaryDirectories.push(cwd);
		await mkdir(join(cwd, 'company/skills/demo'), { recursive: true });
		await writeFile(join(cwd, 'anchor.js'), 'const anchor = 1;\n');
		await writeFile(
			join(cwd, 'company/skills/demo/SKILL.md'),
			`---
name: demo
---
`,
		);
		await writeFile(
			join(cwd, '.oxlintrc.json'),
			JSON.stringify({
				categories: { correctness: 'off' },
				jsPlugins: [resolve('dist/index.js')],
				rules: {
					'skills/valid-frontmatter': ['error', { roots: ['company/skills'] }],
				},
			}),
		);

		const result = spawnSync(
			process.execPath,
			[
				resolve('node_modules/oxlint/bin/oxlint'),
				'--config',
				'.oxlintrc.json',
				'anchor.js',
				'--format',
				'unix',
			],
			{ cwd, encoding: 'utf8' },
		);
		const output = `${result.stdout}${result.stderr}`;

		expect(result.status).toBe(1);
		expect(output).toContain('company/skills/demo/SKILL.md:1');
		expect(output).toContain('[Error/skills(valid-frontmatter)]');
	});
});
