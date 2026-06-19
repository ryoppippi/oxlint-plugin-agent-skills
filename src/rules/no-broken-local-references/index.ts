import { realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

import { fromMarkdown } from 'mdast-util-from-markdown';

import { createSkillRule } from '../../create-skill-rule.ts';

export interface LocalReferenceIssue {
	line: number;
	message: string;
}

interface MarkdownNode {
	children?: unknown;
	position?: {
		start?: {
			line?: unknown;
		};
	};
	type?: unknown;
	url?: unknown;
}

export const noBrokenLocalReferencesRule = createSkillRule(
	'Require local SKILL.md references to resolve inside the skill directory.',
	validateLocalReferences,
);

export function validateLocalReferences(filePath: string, source: string): LocalReferenceIssue[] {
	const issues: LocalReferenceIssue[] = [];
	visitNode(fromMarkdown(source), dirname(filePath), issues);
	return issues;
}

function visitNode(node: unknown, skillDirectory: string, issues: LocalReferenceIssue[]): void {
	if (!isMarkdownNode(node)) {
		return;
	}

	if (
		(node.type === 'link' || node.type === 'image' || node.type === 'definition') &&
		typeof node.url === 'string' &&
		isLocalReference(node.url)
	) {
		const line = typeof node.position?.start?.line === 'number' ? node.position.start.line : 1;
		const path = decodePath(node.url.split(/[?#]/, 1)[0] ?? '');
		const target = resolve(skillDirectory, path);

		if (escapesDirectory(skillDirectory, target)) {
			issues.push({
				line,
				message: `Reference "${node.url}" escapes the skill directory.`,
			});
		} else if (!isFileInsideDirectory(skillDirectory, target)) {
			issues.push({
				line,
				message: `Reference "${node.url}" does not resolve to a file in this skill.`,
			});
		}
	}

	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			visitNode(child, skillDirectory, issues);
		}
	}
}

function isLocalReference(url: string): boolean {
	return (
		url.length > 0 &&
		!url.startsWith('#') &&
		!url.startsWith('/') &&
		!url.startsWith('//') &&
		!/^[a-z][a-z\d+.-]*:/i.test(url)
	);
}

function decodePath(path: string): string {
	try {
		return decodeURI(path);
	} catch {
		return path;
	}
}

function escapesDirectory(directory: string, target: string): boolean {
	const path = relative(directory, target);
	return path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path);
}

function isFileInsideDirectory(directory: string, target: string): boolean {
	try {
		return (
			statSync(target).isFile() && !escapesDirectory(realpathSync(directory), realpathSync(target))
		);
	} catch {
		return false;
	}
}

function isMarkdownNode(value: unknown): value is MarkdownNode {
	return typeof value === 'object' && value !== null;
}
