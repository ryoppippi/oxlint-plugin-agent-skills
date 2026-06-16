/**
 * Implements `skills/max-skill-lines`.
 *
 * SKILL.md is the instruction entry point loaded when an Agent Skill
 * activates. The authoring guidance recommends keeping that entry point under
 * 500 lines and moving detailed material into focused reference files. This
 * keeps activation context small while preserving information that can be
 * loaded only when needed.
 *
 * Line counting follows text-file semantics: every newline terminates a line,
 * and a final unterminated fragment counts as one additional line. A trailing
 * newline does not create an extra empty line. The first line over the
 * configured maximum is used as the diagnostic location.
 *
 * The public Oxlint rule uses the recommended 500-line limit. The validator
 * accepts a custom maximum to keep its boundary behavior independently
 * testable without changing the rule's user-facing contract.
 *
 * @see https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
 */
import { createSkillRule } from './rule.ts';

export interface SkillLengthIssue {
	line: number;
	message: string;
}

/**
 * Oxlint rule that limits each SKILL.md entry point to 500 lines.
 */
export const maxSkillLinesRule = createSkillRule(
	'Limit SKILL.md instructions to 500 lines.',
	(_filePath, source) => validateSkillLength(source),
);

export function validateSkillLength(source: string, maxLines = 500): SkillLengthIssue | undefined {
	const lineCount =
		source.length === 0 ? 0 : (source.match(/\n/g)?.length ?? 0) + (source.endsWith('\n') ? 0 : 1);

	if (lineCount <= maxLines) {
		return undefined;
	}

	return {
		line: maxLines + 1,
		message: `SKILL.md has ${lineCount} lines; keep it at or below ${maxLines} lines and move details into referenced files.`,
	};
}
