import { readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { parseDocument } from 'yaml';

import { createSkillRule } from '../../create-skill-rule.ts';

export interface OpenAiMetadataIssue {
	line: number;
	message: string;
}

type RecordValue = Record<string, unknown>;

const INTERFACE_FIELDS = new Set([
	'brand_color',
	'default_prompt',
	'display_name',
	'icon_large',
	'icon_small',
	'short_description',
]);
const POLICY_FIELDS = new Set(['allow_implicit_invocation']);
const DEPENDENCY_FIELDS = new Set(['tools']);
const TOOL_FIELDS = new Set(['description', 'transport', 'type', 'url', 'value']);
const TOP_LEVEL_FIELDS = new Set(['dependencies', 'interface', 'policy']);

export const validOpenAiMetadataRule = createSkillRule(
	'Validate optional Codex agents/openai.yaml metadata.',
	validateOpenAiMetadata,
	{
		strict: {
			type: 'boolean',
		},
	},
	false,
);

export function validateOpenAiMetadata(
	filePath: string,
	_source = '',
	option?: unknown,
): OpenAiMetadataIssue[] {
	const skillDirectory = dirname(filePath);
	const metadataPath = join(skillDirectory, 'agents/openai.yaml');
	let source: string;

	try {
		source = readFileSync(metadataPath, 'utf8');
	} catch (error) {
		if (isMissingFileError(error)) {
			return [];
		}

		throw error;
	}

	const document = parseDocument(source);

	if (document.errors.length > 0) {
		return [issue('agents/openai.yaml must contain valid YAML.')];
	}

	const metadata = document.toJS();

	if (!isRecord(metadata)) {
		return [issue('agents/openai.yaml must contain a key-value mapping.')];
	}

	const issues: OpenAiMetadataIssue[] = [];
	validateInterface(metadata.interface, skillDirectory, issues);
	validatePolicy(metadata.policy, issues);
	validateDependencies(metadata.dependencies, issues);

	if (readStrict(option)) {
		validateUnknownFields(metadata, issues);
	}

	return issues;
}

function validateInterface(
	value: unknown,
	skillDirectory: string,
	issues: OpenAiMetadataIssue[],
): void {
	if (value === undefined) {
		return;
	}

	if (!isRecord(value)) {
		issues.push(issue('interface must be a key-value mapping.'));
		return;
	}

	for (const field of [
		'display_name',
		'short_description',
		'default_prompt',
	] as const satisfies readonly (keyof typeof value)[]) {
		if (value[field] !== undefined && typeof value[field] !== 'string') {
			issues.push(issue(`interface.${field} must be a string.`));
		}
	}

	if (
		value.brand_color !== undefined &&
		(typeof value.brand_color !== 'string' || !/^#[\da-f]{6}$/i.test(value.brand_color))
	) {
		issues.push(issue('interface.brand_color must be a hexadecimal colour.'));
	}

	for (const field of ['icon_small', 'icon_large'] as const) {
		const path = value[field];

		if (
			typeof path !== 'string' ||
			path.length === 0 ||
			!isFileInsideDirectory(skillDirectory, resolve(skillDirectory, path))
		) {
			if (path !== undefined) {
				issues.push(issue(`interface.${field} must resolve to a file inside the skill directory.`));
			}
		}
	}
}

function validatePolicy(value: unknown, issues: OpenAiMetadataIssue[]): void {
	if (value === undefined) {
		return;
	}

	if (!isRecord(value)) {
		issues.push(issue('policy must be a key-value mapping.'));
		return;
	}

	if (
		value.allow_implicit_invocation !== undefined &&
		typeof value.allow_implicit_invocation !== 'boolean'
	) {
		issues.push(issue('policy.allow_implicit_invocation must be a boolean.'));
	}
}

function validateDependencies(value: unknown, issues: OpenAiMetadataIssue[]): void {
	if (value === undefined) {
		return;
	}

	if (!isRecord(value)) {
		issues.push(issue('dependencies must be a key-value mapping.'));
		return;
	}

	if (value.tools === undefined) {
		return;
	}

	if (!Array.isArray(value.tools)) {
		issues.push(issue('dependencies.tools must be an array.'));
		return;
	}

	for (const [index, tool] of value.tools.entries()) {
		if (!isRecord(tool)) {
			issues.push(issue(`dependencies.tools[${index}] must be a key-value mapping.`));
			continue;
		}

		if (tool.type !== 'mcp') {
			issues.push(issue(`dependencies.tools[${index}].type must be "mcp".`));
		}

		if (typeof tool.value !== 'string' || tool.value.length === 0) {
			issues.push(issue(`dependencies.tools[${index}].value must be a non-empty string.`));
		}

		for (const field of ['description', 'transport', 'url'] as const) {
			if (tool[field] !== undefined && typeof tool[field] !== 'string') {
				issues.push(issue(`dependencies.tools[${index}].${field} must be a string.`));
			}
		}
	}
}

function validateUnknownFields(metadata: RecordValue, issues: OpenAiMetadataIssue[]): void {
	pushUnknownFields(metadata, TOP_LEVEL_FIELDS, '', issues);

	if (isRecord(metadata.interface)) {
		pushUnknownFields(metadata.interface, INTERFACE_FIELDS, 'interface.', issues);
	}

	if (isRecord(metadata.policy)) {
		pushUnknownFields(metadata.policy, POLICY_FIELDS, 'policy.', issues);
	}

	if (isRecord(metadata.dependencies)) {
		pushUnknownFields(metadata.dependencies, DEPENDENCY_FIELDS, 'dependencies.', issues);

		if (Array.isArray(metadata.dependencies.tools)) {
			for (const [index, tool] of metadata.dependencies.tools.entries()) {
				if (isRecord(tool)) {
					pushUnknownFields(tool, TOOL_FIELDS, `dependencies.tools[${index}].`, issues);
				}
			}
		}
	}
}

function pushUnknownFields(
	value: RecordValue,
	allowed: ReadonlySet<string>,
	prefix: string,
	issues: OpenAiMetadataIssue[],
): void {
	for (const field of Object.keys(value)
		.filter((field) => !allowed.has(field))
		.sort()) {
		issues.push(issue(`Unknown agents/openai.yaml field "${prefix}${field}".`));
	}
}

function isFileInsideDirectory(directory: string, target: string): boolean {
	try {
		const realDirectory = realpathSync(directory);
		const realTarget = realpathSync(target);
		const path = relative(realDirectory, realTarget);
		return (
			statSync(realTarget).isFile() &&
			path !== '..' &&
			!path.startsWith(`..${sep}`) &&
			!isAbsolute(path)
		);
	} catch {
		return false;
	}
}

function readStrict(option: unknown): boolean {
	return (
		typeof option === 'object' && option !== null && 'strict' in option && option.strict === true
	);
}

function isMissingFileError(error: unknown): boolean {
	return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function isRecord(value: unknown): value is RecordValue {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(message: string): OpenAiMetadataIssue {
	return { line: 1, message };
}
