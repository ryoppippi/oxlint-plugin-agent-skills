import { fromMarkdown } from 'mdast-util-from-markdown';

export interface ReferenceDepthIssue {
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

export function validateReferenceDepth(source: string): ReferenceDepthIssue[] {
	const issues: ReferenceDepthIssue[] = [];
	visitNode(fromMarkdown(source), issues);
	return issues;
}

function visitNode(node: unknown, issues: ReferenceDepthIssue[]): void {
	if (!isMarkdownNode(node)) {
		return;
	}

	if (
		(node.type === 'link' || node.type === 'image' || node.type === 'definition') &&
		typeof node.url === 'string' &&
		isDeepRelativeReference(node.url)
	) {
		issues.push({
			line: typeof node.position?.start?.line === 'number' ? node.position.start.line : 1,
			message: `Reference "${node.url}" is nested too deeply; link files at most one directory below SKILL.md.`,
		});
	}

	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			visitNode(child, issues);
		}
	}
}

function isDeepRelativeReference(url: string): boolean {
	if (
		url.startsWith('#') ||
		url.startsWith('/') ||
		url.startsWith('//') ||
		/^[a-z][a-z\d+.-]*:/i.test(url)
	) {
		return false;
	}

	const path = url.split(/[?#]/, 1)[0] ?? '';
	const segments = path.split('/').filter((segment) => segment !== '' && segment !== '.');

	return segments.includes('..') || segments.length > 2;
}

function isMarkdownNode(value: unknown): value is MarkdownNode {
	return typeof value === 'object' && value !== null;
}
