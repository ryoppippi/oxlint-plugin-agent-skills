# `skills/max-skill-lines`

Limits `SKILL.md` to a configurable number of lines. The default is 220.

A community analysis of 30 days of Codex sessions found that the median initial
skill read was 220 lines across several model and reasoning configurations.
This rule uses that observed boundary as an operational safeguard so critical
instructions are less likely to fall outside the first read. It is not a limit
defined by the Agent Skills specification.

Move detailed guidance into directly linked files such as
`references/api.md`.

## Options

Set `maxLines` to any positive integer. Use `roots` to replace the default
skill roots:

```json
{
	"skills/max-skill-lines": [
		"error",
		{
			"maxLines": 300,
			"roots": ["company/skills"]
		}
	]
}
```

## References

- [Codex 220-line skill read analysis](https://www.reddit.com/r/codex/comments/1t1rbqt/codex_may_only_read_the_first_220_lines_of_a/)
- [Claude skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
