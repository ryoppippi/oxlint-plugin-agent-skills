import { createFixture } from 'fs-fixture';

import { discoverSkillFiles } from './create-skill-rule.ts';

test('follows symlinked skill directories', async () => {
	await using fixture = await createFixture({
		'.agents/skills/example': ({ getPath, symlink }) => symlink(getPath('shared/example')),
		'shared/example/SKILL.md': '# Example\n',
	});

	expect(discoverSkillFiles(fixture.path)).toEqual([
		fixture.getPath('.agents/skills/example/SKILL.md'),
	]);
});

test('deduplicates files discovered through overlapping roots', async () => {
	await using fixture = await createFixture({
		'skills/example/SKILL.md': '# Example\n',
	});

	expect(discoverSkillFiles(fixture.path, ['skills', 'skills/example'])).toEqual([
		fixture.getPath('skills/example/SKILL.md'),
	]);
});

test('does not recurse forever through symlink cycles', async () => {
	await using fixture = await createFixture({
		'skills/example/cycle': ({ getPath, symlink }) => symlink(getPath('skills')),
		'skills/example/SKILL.md': '# Example\n',
	});

	expect(discoverSkillFiles(fixture.path, ['skills'])).toEqual([
		fixture.getPath('skills/example/SKILL.md'),
	]);
});

test('ignores broken symlinks while scanning skills', async () => {
	await using fixture = await createFixture({
		'skills/broken': ({ getPath, symlink }) => symlink(getPath('missing')),
	});

	expect(discoverSkillFiles(fixture.path, ['skills'])).toEqual([]);
});
