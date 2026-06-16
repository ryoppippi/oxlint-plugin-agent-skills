/**
 * Implements `skills/no-windows-paths`.
 *
 * Agent Skill authoring guidance requires forward slashes in file references:
 * Windows-style backslash paths such as `scripts\helper.py` break when an agent
 * runs on a Unix system. This rule reports relative Markdown links, images, and
 * definitions whose target contains a backslash.
 *
 * To avoid false positives the rule inspects only parsed Markdown reference
 * targets — never prose or fenced code — reusing the same mdast traversal as
 * `no-deep-references`. A backslash in a code sample, regular expression, or
 * escape sequence is therefore never flagged; only an actual link/image target
 * is. Protocol URLs, absolute paths, and fragments are left alone.
 *
 * @see https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
 */
import { fromMarkdown } from 'mdast-util-from-markdown';

import { createSkillRule } from '../../create-skill-rule.ts';

export interface WindowsPathIssue {
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

/**
 * Oxlint rule that rejects backslash file references in SKILL.md.
 */
export const noWindowsPathsRule = createSkillRule(
	'Require forward slashes in SKILL.md file references.',
	(_filePath, source) => validateWindowsPaths(source),
);

export function validateWindowsPaths(source: string): WindowsPathIssue[] {
	const issues: WindowsPathIssue[] = [];
	visitNode(fromMarkdown(source), issues);
	return issues;
}

function visitNode(node: unknown, issues: WindowsPathIssue[]): void {
	if (!isMarkdownNode(node)) {
		return;
	}

	if (
		(node.type === 'link' || node.type === 'image' || node.type === 'definition') &&
		typeof node.url === 'string' &&
		isBackslashRelativeReference(node.url)
	) {
		issues.push({
			line: typeof node.position?.start?.line === 'number' ? node.position.start.line : 1,
			message: `Reference "${node.url}" uses a Windows-style path; use forward slashes (/) in skill file references.`,
		});
	}

	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			visitNode(child, issues);
		}
	}
}

function isBackslashRelativeReference(url: string): boolean {
	// Leave protocol URLs (including Windows drive letters like `C:\`), absolute
	// paths, and fragments to other rules; only relative references are in scope.
	if (
		url.startsWith('#') ||
		url.startsWith('/') ||
		url.startsWith('//') ||
		/^[a-z][a-z\d+.-]*:/i.test(url)
	) {
		return false;
	}

	return url.includes('\\');
}

function isMarkdownNode(value: unknown): value is MarkdownNode {
	return typeof value === 'object' && value !== null;
}

if (import.meta.vitest) {
	test('accepts forward-slash references', async () => {
		expect(validateWindowsPaths(await readFixture('./__fixture__/valid/SKILL.md'))).toEqual([]);
	});

	test('reports a backslash reference target', async () => {
		expect(validateWindowsPaths(await readFixture('./__fixture__/invalid/SKILL.md'))).toEqual([
			{
				line: 7,
				message:
					'Reference "scripts\\helper.py" uses a Windows-style path; use forward slashes (/) in skill file references.',
			},
		]);
	});

	test('ignores backslashes outside reference targets', () => {
		const source =
			'---\nname: t\ndescription: d\n---\n\nThe regex `\\d+\\w` and a path scripts\\helper.py in prose.\n\n```\nrun scripts\\build.sh\n```\n';

		expect(validateWindowsPaths(source)).toEqual([]);
	});

	async function readFixture(path: string): Promise<string> {
		const { readFile } = await import('node:fs/promises');
		return readFile(new URL(path, import.meta.url), 'utf8');
	}
}
