import { realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, sep } from 'node:path';

export function escapesDirectory(directory: string, target: string): boolean {
	const path = relative(directory, target);
	return path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path);
}

export function isFileInsideDirectory(directory: string, target: string): boolean {
	try {
		return (
			statSync(target).isFile() && !escapesDirectory(realpathSync(directory), realpathSync(target))
		);
	} catch {
		return false;
	}
}
