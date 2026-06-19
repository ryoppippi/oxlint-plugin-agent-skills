/**
 * Implements `skills/max-skill-lines`.
 *
 * SKILL.md is the instruction entry point loaded when an Agent Skill
 * activates. A community analysis of 30 days of Codex sessions found that the
 * median initial skill read was 220 lines across several model and reasoning
 * configurations. This rule treats that observed read boundary as an
 * operational limit so critical instructions are less likely to fall outside
 * the first read. It is not a limit in the Agent Skills specification.
 *
 * Line counting follows text-file semantics: every newline terminates a line,
 * and a final unterminated fragment counts as one additional line. A trailing
 * newline does not create an extra empty line. The first line over the
 * configured maximum is used as the diagnostic location.
 *
 * The public Oxlint rule defaults to 220 lines and accepts any positive integer
 * through the `maxLines` option.
 *
 * @see https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
 * @see https://www.reddit.com/r/codex/comments/1t1rbqt/codex_may_only_read_the_first_220_lines_of_a/
 */
import { createSkillRule } from '../../create-skill-rule.ts';

export interface SkillLengthIssue {
	line: number;
	message: string;
}

/**
 * Oxlint rule that limits each SKILL.md entry point to a configurable length.
 */
export const maxSkillLinesRule = createSkillRule(
	'Limit SKILL.md instructions to a configurable number of lines.',
	(_filePath, source, option) => validateSkillLength(source, readMaxLines(option)),
	{
		maxLines: {
			minimum: 1,
			type: 'integer',
		},
	},
);

export function validateSkillLength(source: string, maxLines = 220): SkillLengthIssue | undefined {
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

	return 220;
}

if (import.meta.vitest) {
	test('accepts a SKILL.md with 220 lines', () => {
		expect(validateSkillLength(Array(220).fill('line').join('\n'))).toBeUndefined();
	});

	test('reports a SKILL.md with more than 220 lines', () => {
		expect(validateSkillLength(Array(221).fill('line').join('\n'))).toEqual({
			line: 221,
			message:
				'SKILL.md has 221 lines; keep it at or below 220 lines and move details into referenced files.',
		});
	});

	test('uses a configured line limit', () => {
		expect(validateSkillLength(Array(220).fill('line').join('\n'), 219)).toEqual({
			line: 220,
			message:
				'SKILL.md has 220 lines; keep it at or below 219 lines and move details into referenced files.',
		});
	});
}
