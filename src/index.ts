import { definePlugin } from '@oxlint/plugins';

import { descriptionThirdPersonRule } from './rules/description-third-person/index.ts';
import { maxSkillLinesRule } from './rules/max-skill-lines/index.ts';
import { nameMatchesDirectoryRule } from './rules/name-matches-directory/index.ts';
import { noDeepReferencesRule } from './rules/no-deep-references/index.ts';
import { noDuplicateSkillNameRule } from './rules/no-duplicate-skill-name/index.ts';
import { noEmptySkillBodyRule } from './rules/no-empty-skill-body/index.ts';
import { noWindowsPathsRule } from './rules/no-windows-paths/index.ts';
import { skillIndexBudgetRule } from './rules/skill-index-budget/index.ts';
import { validFrontmatterRule } from './rules/valid-frontmatter/index.ts';

const plugin = definePlugin({
	meta: {
		name: 'oxlint-plugin-skills',
	},
	rules: {
		'description-third-person': descriptionThirdPersonRule,
		'max-skill-lines': maxSkillLinesRule,
		'name-matches-directory': nameMatchesDirectoryRule,
		'no-deep-references': noDeepReferencesRule,
		'no-duplicate-skill-name': noDuplicateSkillNameRule,
		'no-empty-skill-body': noEmptySkillBodyRule,
		'no-windows-paths': noWindowsPathsRule,
		'skill-index-budget': skillIndexBudgetRule,
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
			'description-third-person',
			'max-skill-lines',
			'name-matches-directory',
			'no-deep-references',
			'no-duplicate-skill-name',
			'no-empty-skill-body',
			'no-windows-paths',
			'skill-index-budget',
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
		await copyFixture(
			'./rules/no-duplicate-skill-name/__fixture__/invalid/a/code-review/SKILL.md',
			join(cwd, '.agents/skills/code-review/SKILL.md'),
		);
		await copyFixture(
			'./rules/no-duplicate-skill-name/__fixture__/invalid/b/code-review/SKILL.md',
			join(cwd, 'agents/skills/code-review/SKILL.md'),
		);
		await copyFixture(
			'./rules/no-empty-skill-body/__fixture__/invalid/SKILL.md',
			join(cwd, '.agents/skills/empty-body/SKILL.md'),
		);
		await copyFixture(
			'./rules/no-windows-paths/__fixture__/invalid/SKILL.md',
			join(cwd, '.agents/skills/backslash-paths/SKILL.md'),
		);
		await copyFixture(
			'./rules/description-third-person/__fixture__/invalid/SKILL.md',
			join(cwd, '.agents/skills/first-person/SKILL.md'),
		);
		await writeFile(join(cwd, 'anchor.js'), 'const anchor = 1;\n');
		await writeFile(
			join(cwd, '.oxlintrc.json'),
			JSON.stringify({
				categories: { correctness: 'off' },
				jsPlugins: [resolve('dist/index.js')],
				rules: {
					'skills/description-third-person': 'error',
					'skills/max-skill-lines': 'error',
					'skills/name-matches-directory': 'error',
					'skills/no-deep-references': 'error',
					'skills/no-duplicate-skill-name': 'error',
					'skills/no-empty-skill-body': 'error',
					'skills/no-windows-paths': 'error',
					'skills/skill-index-budget': ['error', { maxCharacters: 1 }],
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
		expect(output).toContain('[Error/skills(no-duplicate-skill-name)]');
		expect(output).toContain('[Error/skills(no-empty-skill-body)]');
		expect(output).toContain('[Error/skills(skill-index-budget)]');
		expect(output).toContain('[Error/skills(no-windows-paths)]');
		expect(output).toContain('[Error/skills(description-third-person)]');
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

	test('uses the configured maximum skill length', async () => {
		const { mkdtemp, writeFile } = await import('node:fs/promises');
		const { tmpdir } = await import('node:os');
		const { join, resolve } = await import('node:path');
		const { spawnSync } = await import('node:child_process');
		const cwd = await mkdtemp(join(tmpdir(), 'oxlint-plugin-skills-'));
		temporaryDirectories.push(cwd);
		await copyFixture(
			'./rules/max-skill-lines/__fixture__/valid/SKILL.md',
			join(cwd, '.agents/skills/valid/SKILL.md'),
		);
		await writeFile(join(cwd, 'anchor.js'), 'const anchor = 1;\n');
		await writeFile(
			join(cwd, '.oxlintrc.json'),
			JSON.stringify({
				categories: { correctness: 'off' },
				jsPlugins: [resolve('dist/index.js')],
				rules: {
					'skills/max-skill-lines': ['error', { maxLines: 219 }],
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
		expect(output).toContain(
			'SKILL.md has 220 lines; keep it at or below 219 lines and move details into referenced files.',
		);
		expect(output).toContain('[Error/skills(max-skill-lines)]');
	});

	async function copyFixture(source: string, destination: string): Promise<void> {
		const { copyFile, mkdir } = await import('node:fs/promises');
		const { dirname } = await import('node:path');
		await mkdir(dirname(destination), { recursive: true });
		await copyFile(new URL(source, import.meta.url), destination);
	}
}
