/**
 * Implements `skills/no-deep-references`.
 *
 * Agent Skill authoring guidance recommends linking supporting files no more
 * than one directory below SKILL.md. Shallow references make the skill easier
 * for an agent to navigate and avoid chains of documents that hide essential
 * instructions several levels away from the entry point.
 *
 * Markdown is parsed into an mdast tree so links, images, and definitions are
 * checked structurally. Link-looking text inside fenced code blocks is not a
 * reference and is therefore ignored. Absolute paths, fragments, protocol
 * URLs, and protocol-relative URLs are also outside this repository-relative
 * depth rule.
 *
 * Direct files such as `FORMS.md` and one-directory paths such as
 * `references/api.md` are accepted. Paths with more segments or any `..`
 * traversal are reported at the Markdown node's starting line.
 *
 * @see https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
 */
import { fromMarkdown } from 'mdast-util-from-markdown';

import { createSkillRule } from '../../create-skill-rule.ts';

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

/**
 * Oxlint rule that rejects relative skill references deeper than one
 * directory below SKILL.md.
 */
export const noDeepReferencesRule = createSkillRule(
	'Keep SKILL.md file references at most one directory deep.',
	(_filePath, source) => validateReferenceDepth(source),
);

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

if (import.meta.vitest) {
	test('accepts top-level and one-directory references', async () => {
		const issues = validateReferenceDepth(
			await readFixture('./__fixture__/valid/shallow/SKILL.md'),
		);

		expect(issues).toEqual([]);
	});

	test('reports references nested more than one directory deep', async () => {
		const issues = validateReferenceDepth(await readFixture('./__fixture__/invalid/SKILL.md'));

		expect(issues).toEqual([
			{
				line: 6,
				message:
					'Reference "references/platform/api.md" is nested too deeply; link files at most one directory below SKILL.md.',
			},
		]);
	});

	test('ignores external links and Markdown inside code blocks', async () => {
		const issues = validateReferenceDepth(
			await readFixture('./__fixture__/valid/ignored/SKILL.md'),
		);

		expect(issues).toEqual([]);
	});

	async function readFixture(path: string): Promise<string> {
		const { readFile } = await import('node:fs/promises');
		return readFile(new URL(path, import.meta.url), 'utf8');
	}
}
