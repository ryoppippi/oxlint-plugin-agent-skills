import { readFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';

import { fromMarkdown } from 'mdast-util-from-markdown';

import { createSkillRule } from '../../create-skill-rule.ts';

export const DEFAULT_MAX_REFERENCE_LINES = 100;

export interface ReferenceTableOfContentsIssue {
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

const TEXT_EXTENSIONS = new Set(['.adoc', '.md', '.mdx', '.rst', '.txt']);
const TABLE_OF_CONTENTS_LINK = /^\s*[-*+]\s+\[[^\]]+\]\(#[^)]+\)/;

export const longReferenceHasTocRule = createSkillRule(
	'Require long text references to include a table of contents near the top.',
	validateReferenceTablesOfContents,
	{
		maxLines: {
			minimum: 1,
			type: 'integer',
		},
	},
);

export function validateReferenceTablesOfContents(
	filePath: string,
	source: string,
	option?: unknown,
): ReferenceTableOfContentsIssue[] {
	const issues: ReferenceTableOfContentsIssue[] = [];
	visitNode(fromMarkdown(source), dirname(filePath), readMaxLines(option), issues);
	return issues;
}

function visitNode(
	node: unknown,
	skillDirectory: string,
	maxLines: number,
	issues: ReferenceTableOfContentsIssue[],
): void {
	if (!isMarkdownNode(node)) {
		return;
	}

	if (
		(node.type === 'link' || node.type === 'definition') &&
		typeof node.url === 'string' &&
		isLocalReference(node.url)
	) {
		validateReference(node, node.url, skillDirectory, maxLines, issues);
	}

	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			visitNode(child, skillDirectory, maxLines, issues);
		}
	}
}

function validateReference(
	node: MarkdownNode,
	url: string,
	skillDirectory: string,
	maxLines: number,
	issues: ReferenceTableOfContentsIssue[],
): void {
	const path = decodePath(url.split(/[?#]/, 1)[0] ?? '');
	const target = resolve(skillDirectory, path);

	if (
		!TEXT_EXTENSIONS.has(extname(target).toLowerCase()) ||
		escapesDirectory(skillDirectory, target)
	) {
		return;
	}

	let reference: string;

	try {
		reference = readFileSync(target, 'utf8');
	} catch {
		return;
	}

	const lines = reference.split(/\r?\n/);
	const lineCount =
		reference.length === 0
			? 0
			: (reference.match(/\n/g)?.length ?? 0) + (reference.endsWith('\n') ? 0 : 1);

	if (
		lineCount <= maxLines ||
		lines.slice(0, 20).some((line) => TABLE_OF_CONTENTS_LINK.test(line))
	) {
		return;
	}

	issues.push({
		line: typeof node.position?.start?.line === 'number' ? node.position.start.line : 1,
		message: `Reference "${url}" has ${lineCount} lines; add a table of contents near the top.`,
	});
}

function readMaxLines(option: unknown): number {
	if (
		typeof option === 'object' &&
		option !== null &&
		'maxLines' in option &&
		typeof option.maxLines === 'number' &&
		Number.isInteger(option.maxLines) &&
		option.maxLines >= 1
	) {
		return option.maxLines;
	}

	return DEFAULT_MAX_REFERENCE_LINES;
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

function isMarkdownNode(value: unknown): value is MarkdownNode {
	return typeof value === 'object' && value !== null;
}
