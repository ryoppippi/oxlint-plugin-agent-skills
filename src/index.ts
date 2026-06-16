import { definePlugin } from '@oxlint/plugins';

import { maxSkillLinesRule } from './rules/max-skill-lines/index.ts';
import { nameMatchesDirectoryRule } from './rules/name-matches-directory/index.ts';
import { noDeepReferencesRule } from './rules/no-deep-references/index.ts';
import { validFrontmatterRule } from './rules/valid-frontmatter/index.ts';

const plugin = definePlugin({
	meta: {
		name: 'oxlint-plugin-skills',
	},
	rules: {
		'max-skill-lines': maxSkillLinesRule,
		'name-matches-directory': nameMatchesDirectoryRule,
		'no-deep-references': noDeepReferencesRule,
		'valid-frontmatter': validFrontmatterRule,
	},
});

export default plugin;

if (import.meta.vitest) {
	const temporaryDirectories: string[] = [];

	afterEach(async () => {
		const { rm } = await import('node:fs/promises');

		await Promise.all(
			temporaryDirectories
				.splice(0)
				.map((directory) => rm(directory, { force: true, recursive: true })),
		);
	});

	test('exports the oxlint-plugin-skills JavaScript plugin', () => {
		expect(plugin.meta?.name).toBe('oxlint-plugin-skills');
		expect(Object.keys(plugin.rules).sort()).toEqual([
			'max-skill-lines',
			'name-matches-directory',
			'no-deep-references',
			'valid-frontmatter',
		]);
	});

	test('reports Agent Skill violations through JavaScript plugin rules', async () => {
		const { mkdtemp, writeFile } = await import('node:fs/promises');
		const { tmpdir } = await import('node:os');
		const { join, resolve } = await import('node:path');
		const { spawnSync } = await import('node:child_process');
		const cwd = await mkdtemp(join(tmpdir(), 'oxlint-plugin-skills-'));
		temporaryDirectories.push(cwd);
		await copyFixture(
			'./rules/max-skill-lines/__fixture__/invalid/SKILL.md',
			join(cwd, '.agents/skills/invalid/SKILL.md'),
		);
		await copyFixture(
			'./rules/name-matches-directory/__fixture__/invalid/mismatched-name/reviewing-code/SKILL.md',
			join(cwd, '.agents/skills/reviewing-code/SKILL.md'),
		);
		await copyFixture(
			'./rules/no-deep-references/__fixture__/invalid/SKILL.md',
			join(cwd, '.agents/skills/deep-reference/SKILL.md'),
		);
		await copyFixture(
			'./rules/valid-frontmatter/__fixture__/invalid/missing-required/SKILL.md',
			join(cwd, '.agents/skills/missing-required/SKILL.md'),
		);
		await writeFile(join(cwd, 'anchor.js'), 'const anchor = 1;\n');
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
	});

	test('scans configured skill roots', async () => {
		const { mkdtemp, writeFile } = await import('node:fs/promises');
		const { tmpdir } = await import('node:os');
		const { join, resolve } = await import('node:path');
		const { spawnSync } = await import('node:child_process');
		const cwd = await mkdtemp(join(tmpdir(), 'oxlint-plugin-skills-'));
		temporaryDirectories.push(cwd);
		await copyFixture(
			'./__fixture__/integration/custom-root/SKILL.md',
			join(cwd, 'company/skills/custom-root/SKILL.md'),
		);
		await writeFile(join(cwd, 'anchor.js'), 'const anchor = 1;\n');
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
		expect(output).toContain('company/skills/custom-root/SKILL.md:1');
		expect(output).toContain('[Error/skills(valid-frontmatter)]');
	});

	async function copyFixture(source: string, destination: string): Promise<void> {
		const { copyFile, mkdir } = await import('node:fs/promises');
		const { dirname } = await import('node:path');
		await mkdir(dirname(destination), { recursive: true });
		await copyFile(new URL(source, import.meta.url), destination);
	}
}
