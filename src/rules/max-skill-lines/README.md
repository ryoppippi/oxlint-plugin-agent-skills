# `skills/max-skill-lines`

Limits `SKILL.md` to a configurable number of lines. The default is 200.

## Why 200

<details>
<summary>Codex CLI truncates long <code>SKILL.md</code> reads before this default's margin</summary>

Not every host delivers `SKILL.md` in full.
[Empirical analyses of Codex CLI sessions](https://www.reddit.com/r/codex/comments/1t1rbqt/codex_may_only_read_the_first_220_lines_of_a/)
found it reads skills with `sed -n '1,<N>p'` and stops at a model-dependent
boundary:

- [gpt-5.5 truncated at line 220 in 39 of 47 observed reads](https://gist.github.com/haru0416-dev/8c1b01098f46e29d244f2085e408c789)
  and never issued a follow-up read past the cap
- [gpt-5.4 stopped near line 260](https://gist.github.com/haru0416-dev/8c1b01098f46e29d244f2085e408c789)
- Claude Code and OpenCode read `SKILL.md` in full

The truncation comes from Codex's prompt instruction to "read only enough to
follow the workflow", so the boundary is a model interpretation rather than a
documented limit and may shift between model generations. The default of 200
keeps a safety margin below the tightest observed boundary (220), matching the
conservative 180-200 line recommendation from those measurements.

Anthropic's authoring guidance only asks for under 500 lines, so this rule is
an operational safeguard for the strictest host, not a limit defined by the
Agent Skills specification.

</details>

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
- [Codex CLI SKILL.md reading depth: empirical findings](https://gist.github.com/haru0416-dev/8c1b01098f46e29d244f2085e408c789)
- [Claude skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
