import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { discoverSkillFiles } from '../src/skills.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

describe('discoverSkillFiles', () => {
	it('finds SKILL.md files in the standard skill roots', async () => {
		const cwd = await mkdtemp(join(tmpdir(), 'oxlint-plugin-skills-'));
		temporaryDirectories.push(cwd);
		await mkdir(join(cwd, '.agents/skills/commit'), { recursive: true });
		await mkdir(join(cwd, 'agents/skills/testing'), { recursive: true });
		await writeFile(join(cwd, '.agents/skills/commit/SKILL.md'), 'commit');
		await writeFile(join(cwd, 'agents/skills/testing/SKILL.md'), 'testing');

		expect(await discoverSkillFiles(cwd)).toEqual([
			join(cwd, '.agents/skills/commit/SKILL.md'),
			join(cwd, 'agents/skills/testing/SKILL.md'),
		]);
	});
});
