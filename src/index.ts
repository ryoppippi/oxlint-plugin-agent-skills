import { definePlugin } from '@oxlint/plugins';

import { descriptionThirdPersonRule } from './rules/description-third-person/index.ts';
import { longReferenceHasTocRule } from './rules/long-reference-has-toc/index.ts';
import { maxSkillLinesRule } from './rules/max-skill-lines/index.ts';
import { nameMatchesDirectoryRule } from './rules/name-matches-directory/index.ts';
import { noBrokenLocalReferencesRule } from './rules/no-broken-local-references/index.ts';
import { noDeepReferencesRule } from './rules/no-deep-references/index.ts';
import { noDuplicateSkillNameRule } from './rules/no-duplicate-skill-name/index.ts';
import { noEmptySkillBodyRule } from './rules/no-empty-skill-body/index.ts';
import { noUnknownFrontmatterFieldsRule } from './rules/no-unknown-frontmatter-fields/index.ts';
import { noWindowsPathsRule } from './rules/no-windows-paths/index.ts';
import { skillIndexBudgetRule } from './rules/skill-index-budget/index.ts';
import { validFrontmatterRule } from './rules/valid-frontmatter/index.ts';

const plugin = definePlugin({
	meta: {
		name: 'oxlint-plugin-skills',
	},
	rules: {
		'description-third-person': descriptionThirdPersonRule,
		'long-reference-has-toc': longReferenceHasTocRule,
		'max-skill-lines': maxSkillLinesRule,
		'name-matches-directory': nameMatchesDirectoryRule,
		'no-broken-local-references': noBrokenLocalReferencesRule,
		'no-deep-references': noDeepReferencesRule,
		'no-duplicate-skill-name': noDuplicateSkillNameRule,
		'no-empty-skill-body': noEmptySkillBodyRule,
		'no-unknown-frontmatter-fields': noUnknownFrontmatterFieldsRule,
		'no-windows-paths': noWindowsPathsRule,
		'skill-index-budget': skillIndexBudgetRule,
		'valid-frontmatter': validFrontmatterRule,
	},
});

export default plugin;

if (import.meta.vitest) {
	test('exports the oxlint-plugin-skills JavaScript plugin', () => {
		expect(plugin.meta?.name).toBe('oxlint-plugin-skills');
		expect(Object.keys(plugin.rules).toSorted()).toEqual([
			'description-third-person',
			'long-reference-has-toc',
			'max-skill-lines',
			'name-matches-directory',
			'no-broken-local-references',
			'no-deep-references',
			'no-duplicate-skill-name',
			'no-empty-skill-body',
			'no-unknown-frontmatter-fields',
			'no-windows-paths',
			'skill-index-budget',
			'valid-frontmatter',
		]);
	});

	test('reports Agent Skill violations through JavaScript plugin rules', async () => {
		const { createFixture } = await import('fs-fixture');
		const { spawnSync } = await import('node:child_process');
		const path = await import('node:path');
		const { fileURLToPath } = await import('node:url');
		await using fixture = await createFixture({
			'.agents/skills/long-reference/references/api.md': Array(101).fill('content').join('\n'),
			'anchor.js': 'const anchor = 1;\n',
		});
		const fixtureCopies = [
			['./rules/max-skill-lines/__fixture__/invalid/SKILL.md', '.agents/skills/invalid/SKILL.md'],
			[
				'./rules/name-matches-directory/__fixture__/invalid/mismatched-name/reviewing-code/SKILL.md',
				'.agents/skills/reviewing-code/SKILL.md',
			],
			[
				'./rules/no-deep-references/__fixture__/invalid/SKILL.md',
				'.agents/skills/deep-reference/SKILL.md',
			],
			[
				'./rules/valid-frontmatter/__fixture__/invalid/missing-required/SKILL.md',
				'.agents/skills/missing-required/SKILL.md',
			],
			[
				'./rules/no-duplicate-skill-name/__fixture__/invalid/a/code-review/SKILL.md',
				'.agents/skills/code-review/SKILL.md',
			],
			[
				'./rules/no-duplicate-skill-name/__fixture__/invalid/b/code-review/SKILL.md',
				'agents/skills/code-review/SKILL.md',
			],
			[
				'./rules/no-empty-skill-body/__fixture__/invalid/SKILL.md',
				'.agents/skills/empty-body/SKILL.md',
			],
			[
				'./rules/no-windows-paths/__fixture__/invalid/SKILL.md',
				'.agents/skills/backslash-paths/SKILL.md',
			],
			[
				'./rules/description-third-person/__fixture__/invalid/SKILL.md',
				'.agents/skills/first-person/SKILL.md',
			],
			[
				'./rules/no-unknown-frontmatter-fields/__fixture__/invalid/SKILL.md',
				'.agents/skills/typo-field/SKILL.md',
			],
			[
				'./rules/no-deep-references/__fixture__/valid/shallow/SKILL.md',
				'.agents/skills/broken-reference/SKILL.md',
			],
			[
				'./rules/no-deep-references/__fixture__/valid/shallow/SKILL.md',
				'.agents/skills/long-reference/SKILL.md',
			],
		] as const;

		await Promise.all(
			fixtureCopies.map(async ([source, destination]) => {
				await fixture.mkdir(path.dirname(destination));
				await fixture.cp(fileURLToPath(new URL(source, import.meta.url)), destination);
			}),
		);

		await fixture.writeFile(
			'.oxlintrc.json',
			JSON.stringify({
				categories: { correctness: 'off' },
				jsPlugins: [path.resolve('dist/index.js')],
				rules: {
					'skills/description-third-person': 'error',
					'skills/long-reference-has-toc': 'error',
					'skills/max-skill-lines': 'error',
					'skills/name-matches-directory': 'error',
					'skills/no-broken-local-references': 'error',
					'skills/no-deep-references': 'error',
					'skills/no-duplicate-skill-name': 'error',
					'skills/no-empty-skill-body': 'error',
					'skills/no-unknown-frontmatter-fields': 'error',
					'skills/no-windows-paths': 'error',
					'skills/skill-index-budget': ['error', { maxCharacters: 1 }],
					'skills/valid-frontmatter': 'error',
				},
			}),
		);

		const result = spawnSync(
			process.execPath,
			[
				path.resolve('node_modules/oxlint/bin/oxlint'),
				'--config',
				'.oxlintrc.json',
				'anchor.js',
				'--format',
				'unix',
			],
			{ cwd: fixture.path, encoding: 'utf8' },
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
		expect(output).toContain('[Error/skills(no-unknown-frontmatter-fields)]');
		expect(output).toContain('[Error/skills(no-broken-local-references)]');
		expect(output).toContain('[Error/skills(long-reference-has-toc)]');
	});

	test('scans configured skill roots', async () => {
		const { createFixture } = await import('fs-fixture');
		const { spawnSync } = await import('node:child_process');
		const path = await import('node:path');
		const { fileURLToPath } = await import('node:url');
		await using fixture = await createFixture({
			'anchor.js': 'const anchor = 1;\n',
			'company/skills/custom-root': {},
		});
		await fixture.cp(
			fileURLToPath(new URL('./__fixture__/integration/custom-root/SKILL.md', import.meta.url)),
			'company/skills/custom-root/SKILL.md',
		);
		await fixture.writeFile(
			'.oxlintrc.json',
			JSON.stringify({
				categories: { correctness: 'off' },
				jsPlugins: [path.resolve('dist/index.js')],
				rules: {
					'skills/valid-frontmatter': ['error', { roots: ['company/skills'] }],
				},
			}),
		);

		const result = spawnSync(
			process.execPath,
			[
				path.resolve('node_modules/oxlint/bin/oxlint'),
				'--config',
				'.oxlintrc.json',
				'anchor.js',
				'--format',
				'unix',
			],
			{ cwd: fixture.path, encoding: 'utf8' },
		);
		const output = `${result.stdout}${result.stderr}`;

		expect(result.status).toBe(1);
		expect(output).toContain('company/skills/custom-root/SKILL.md:1');
		expect(output).toContain('[Error/skills(valid-frontmatter)]');
	});

	test('uses the configured maximum skill length', async () => {
		const { createFixture } = await import('fs-fixture');
		const { spawnSync } = await import('node:child_process');
		const path = await import('node:path');
		const { fileURLToPath } = await import('node:url');
		await using fixture = await createFixture({
			'.agents/skills/valid': {},
			'anchor.js': 'const anchor = 1;\n',
		});
		await fixture.cp(
			fileURLToPath(new URL('./rules/max-skill-lines/__fixture__/valid/SKILL.md', import.meta.url)),
			'.agents/skills/valid/SKILL.md',
		);
		await fixture.writeFile(
			'.oxlintrc.json',
			JSON.stringify({
				categories: { correctness: 'off' },
				jsPlugins: [path.resolve('dist/index.js')],
				rules: {
					'skills/max-skill-lines': ['error', { maxLines: 219 }],
				},
			}),
		);

		const result = spawnSync(
			process.execPath,
			[
				path.resolve('node_modules/oxlint/bin/oxlint'),
				'--config',
				'.oxlintrc.json',
				'anchor.js',
				'--format',
				'unix',
			],
			{ cwd: fixture.path, encoding: 'utf8' },
		);
		const output = `${result.stdout}${result.stderr}`;

		expect(result.status).toBe(1);
		expect(output).toContain(
			'SKILL.md has 220 lines; keep it at or below 219 lines and move details into referenced files.',
		);
		expect(output).toContain('[Error/skills(max-skill-lines)]');
	});
}
