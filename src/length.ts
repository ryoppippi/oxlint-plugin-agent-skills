export interface SkillLengthIssue {
	line: number;
	message: string;
}

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
