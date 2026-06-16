import { basename, dirname } from 'node:path';

import { parseFrontmatter } from './frontmatter.ts';

export interface DirectoryNameIssue {
	line: number;
	message: string;
}

export function validateDirectoryName(
	filePath: string,
	source: string,
): DirectoryNameIssue | undefined {
	const parsed = parseFrontmatter(source);
	const name = parsed.data?.name;

	if (typeof name !== 'string') {
		return undefined;
	}

	const directoryName = basename(dirname(filePath));

	if (name === directoryName) {
		return undefined;
	}

	const nameLineIndex = parsed.lines.findIndex((line) => line.startsWith('name:'));

	return {
		line: nameLineIndex === -1 ? 1 : nameLineIndex + 1,
		message: `Skill name "${name}" must match its parent directory "${directoryName}".`,
	};
}
