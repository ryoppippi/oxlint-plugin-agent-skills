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
 * The public Oxlint rule uses the 220-line limit. The validator
 * accepts a custom maximum to keep its boundary behavior independently
 * testable without changing the rule's user-facing contract.
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
 * Oxlint rule that limits each SKILL.md entry point to 220 lines.
 */
export const maxSkillLinesRule = createSkillRule(
	'Limit SKILL.md instructions to 220 lines.',
	(_filePath, source) => validateSkillLength(source),
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

if (import.meta.vitest) {
	test('accepts a SKILL.md with 220 lines', async () => {
		expect(validateSkillLength(await readFixture('./__fixture__/valid/SKILL.md'))).toBeUndefined();
	});

	test('reports a SKILL.md with more than 220 lines', async () => {
		expect(validateSkillLength(await readFixture('./__fixture__/invalid/SKILL.md'))).toEqual({
			line: 221,
			message:
				'SKILL.md has 221 lines; keep it at or below 220 lines and move details into referenced files.',
		});
	});

	async function readFixture(path: string): Promise<string> {
		const { readFile } = await import('node:fs/promises');
		return readFile(new URL(path, import.meta.url), 'utf8');
	}
}
