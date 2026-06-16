import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const DEFAULT_SKILL_ROOTS = ['.agents/skills', 'agents/skills', 'skills'] as const;

export function discoverSkillFiles(
	cwd: string,
	roots: readonly string[] = DEFAULT_SKILL_ROOTS,
): string[] {
	const skillFiles: string[] = [];

	for (const root of roots) {
		visitDirectory(resolve(cwd, root), skillFiles);
	}

	return skillFiles.sort();
}

function visitDirectory(directory: string, skillFiles: string[]): void {
	let entries;

	try {
		entries = readdirSync(directory, { withFileTypes: true });
	} catch (error) {
		if (isMissingDirectoryError(error)) {
			return;
		}

		throw error;
	}

	for (const entry of entries) {
		const path = join(directory, entry.name);

		if (entry.isDirectory()) {
			visitDirectory(path, skillFiles);
		} else if (entry.isFile() && entry.name === 'SKILL.md') {
			skillFiles.push(path);
		}
	}
}

function isMissingDirectoryError(error: unknown): boolean {
	return (
		error instanceof Error &&
		'code' in error &&
		(error.code === 'ENOENT' || error.code === 'ENOTDIR')
	);
}
