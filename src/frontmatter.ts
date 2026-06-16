import { parseDocument } from 'yaml';

export type FrontmatterIssueCode =
	| 'invalid-allowed-tools'
	| 'invalid-compatibility'
	| 'invalid-description'
	| 'invalid-frontmatter'
	| 'invalid-license'
	| 'invalid-metadata'
	| 'invalid-metadata-value'
	| 'invalid-name'
	| 'missing-description'
	| 'missing-frontmatter'
	| 'missing-name'
	| 'reserved-name'
	| 'unclosed-frontmatter';

export interface FrontmatterIssue {
	code: FrontmatterIssueCode;
	line: number;
	message: string;
}

type Frontmatter = Record<string, unknown>;

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const XML_TAG_PATTERN = /<[^>]+>/;

export function validateFrontmatter(source: string): FrontmatterIssue[] {
	const lines = source.split(/\r?\n/);

	if (lines[0] !== '---') {
		return [issue('missing-frontmatter', 1, 'SKILL.md must start with YAML frontmatter.')];
	}

	const closingLineIndex = lines.findIndex((line, index) => index > 0 && line === '---');

	if (closingLineIndex === -1) {
		return [issue('unclosed-frontmatter', 1, 'YAML frontmatter must end with a --- delimiter.')];
	}

	const document = parseDocument(lines.slice(1, closingLineIndex).join('\n'));

	if (document.errors.length > 0) {
		return [
			issue(
				'invalid-frontmatter',
				document.errors[0]?.linePos?.[0].line ?? 1,
				'YAML frontmatter must be valid.',
			),
		];
	}

	const frontmatter = document.toJS();

	if (!isRecord(frontmatter)) {
		return [issue('invalid-frontmatter', 1, 'YAML frontmatter must be a key-value mapping.')];
	}

	return validateFields(frontmatter, lines);
}

function validateFields(frontmatter: Frontmatter, lines: readonly string[]): FrontmatterIssue[] {
	const issues: FrontmatterIssue[] = [];
	const name = frontmatter.name;
	const description = frontmatter.description;

	if (name === undefined) {
		issues.push(issue('missing-name', 1, 'Frontmatter requires a name field.'));
	} else if (
		typeof name !== 'string' ||
		name.length === 0 ||
		name.length > 64 ||
		!NAME_PATTERN.test(name) ||
		XML_TAG_PATTERN.test(name)
	) {
		issues.push(
			issue(
				'invalid-name',
				findFieldLine(lines, 'name'),
				'Name must be 1-64 lowercase letters, numbers, or single hyphens.',
			),
		);
	} else if (name.includes('anthropic') || name.includes('claude')) {
		issues.push(
			issue(
				'reserved-name',
				findFieldLine(lines, 'name'),
				'Name must not contain the reserved words anthropic or claude.',
			),
		);
	}

	if (description === undefined) {
		issues.push(issue('missing-description', 1, 'Frontmatter requires a description field.'));
	} else if (
		typeof description !== 'string' ||
		description.length === 0 ||
		description.length > 1024 ||
		XML_TAG_PATTERN.test(description)
	) {
		issues.push(
			issue(
				'invalid-description',
				findFieldLine(lines, 'description'),
				'Description must be a non-empty string of at most 1024 characters without XML tags.',
			),
		);
	}

	validateStringField(frontmatter, lines, 'license', 0, 'invalid-license', issues);
	validateStringField(frontmatter, lines, 'compatibility', 500, 'invalid-compatibility', issues);
	validateMetadata(frontmatter, lines, issues);
	validateStringField(frontmatter, lines, 'allowed-tools', 0, 'invalid-allowed-tools', issues);

	return issues;
}

function validateStringField(
	frontmatter: Frontmatter,
	lines: readonly string[],
	field: string,
	maxLength: number,
	code: 'invalid-allowed-tools' | 'invalid-compatibility' | 'invalid-license',
	issues: FrontmatterIssue[],
): void {
	const value = frontmatter[field];

	if (
		value !== undefined &&
		(typeof value !== 'string' || value.length === 0 || (maxLength > 0 && value.length > maxLength))
	) {
		issues.push(
			issue(
				code,
				findFieldLine(lines, field),
				`${field} must be a non-empty string${maxLength > 0 ? ` of at most ${maxLength} characters` : ''}.`,
			),
		);
	}
}

function validateMetadata(
	frontmatter: Frontmatter,
	lines: readonly string[],
	issues: FrontmatterIssue[],
): void {
	const metadata = frontmatter.metadata;

	if (metadata === undefined) {
		return;
	}

	if (!isRecord(metadata)) {
		issues.push(
			issue(
				'invalid-metadata',
				findFieldLine(lines, 'metadata'),
				'metadata must be a key-value mapping.',
			),
		);
		return;
	}

	if (Object.values(metadata).some((value) => typeof value !== 'string')) {
		issues.push(
			issue(
				'invalid-metadata-value',
				findFieldLine(lines, 'metadata'),
				'metadata values must be strings.',
			),
		);
	}
}

function findFieldLine(lines: readonly string[], field: string): number {
	const index = lines.findIndex((line) => line.startsWith(`${field}:`));
	return index === -1 ? 1 : index + 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(code: FrontmatterIssueCode, line: number, message: string): FrontmatterIssue {
	return { code, line, message };
}
