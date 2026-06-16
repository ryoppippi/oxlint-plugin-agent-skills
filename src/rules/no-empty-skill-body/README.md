# `skills/no-empty-skill-body`

Requires `SKILL.md` to contain instructions after its frontmatter.

Frontmatter only tells the agent _when_ to activate a skill. The body below the
closing `---` is _what_ the agent does once activated, so a skill with valid
frontmatter and an empty body activates yet provides no instructions.

```text
---
name: empty-body
description: Has no instructions yet. Use when nothing should happen.
---
        ← nothing below the closing delimiter
```

The rule stays silent when frontmatter is missing or invalid. Enable
`skills/valid-frontmatter` to report that underlying problem.

## Options

Use `roots` to replace the default skill roots:

```json
{
	"skills/no-empty-skill-body": ["error", { "roots": ["company/skills"] }]
}
```

## References

- [Claude skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
