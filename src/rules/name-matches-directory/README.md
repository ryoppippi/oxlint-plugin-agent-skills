# `skills/name-matches-directory`

Requires the frontmatter `name` to match the directory containing `SKILL.md`.

```text
skills/reviewing-code/SKILL.md
       └────────────┬─────────
                    name: reviewing-code
```

The rule stays silent when frontmatter cannot be parsed. Enable
`skills/valid-frontmatter` to report that underlying problem.

## Options

Use `roots` to replace the default skill roots:

```json
{
	"skills/name-matches-directory": ["error", { "roots": ["company/skills"] }]
}
```

## References

- [Agent Skills specification](https://agentskills.io/specification)
