import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { discoverSkillFiles } from './create-skill-rule.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

test('follows symlinked skill directories', async () => {
	const directory = await createTemporaryDirectory();
	const target = join(directory, 'shared/example');
	await mkdir(target, { recursive: true });
	await writeFile(join(target, 'SKILL.md'), '# Example\n');
	await mkdir(join(directory, '.agents/skills'), { recursive: true });
	await symlink(target, join(directory, '.agents/skills/example'));

	expect(discoverSkillFiles(directory)).toEqual([
		join(directory, '.agents/skills/example/SKILL.md'),
	]);
});

test('deduplicates files discovered through overlapping roots', async () => {
	const directory = await createTemporaryDirectory();
	const skill = join(directory, 'skills/example');
	await mkdir(skill, { recursive: true });
	await writeFile(join(skill, 'SKILL.md'), '# Example\n');

	expect(discoverSkillFiles(directory, ['skills', 'skills/example'])).toEqual([
		join(directory, 'skills/example/SKILL.md'),
	]);
});

test('does not recurse forever through symlink cycles', async () => {
	const directory = await createTemporaryDirectory();
	const skill = join(directory, 'skills/example');
	await mkdir(skill, { recursive: true });
	await writeFile(join(skill, 'SKILL.md'), '# Example\n');
	await symlink(join(directory, 'skills'), join(skill, 'cycle'));

	expect(discoverSkillFiles(directory, ['skills'])).toEqual([
		join(directory, 'skills/example/SKILL.md'),
	]);
});

test('ignores broken symlinks while scanning skills', async () => {
	const directory = await createTemporaryDirectory();
	await mkdir(join(directory, 'skills'), { recursive: true });
	await symlink(join(directory, 'missing'), join(directory, 'skills/broken'));

	expect(discoverSkillFiles(directory, ['skills'])).toEqual([]);
});

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), 'skill-discovery-'));
	temporaryDirectories.push(directory);
	return directory;
}
