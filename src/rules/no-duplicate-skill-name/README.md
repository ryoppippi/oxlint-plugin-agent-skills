# `skills/no-duplicate-skill-name`

Requires every skill `name` to be unique across the configured roots.

A skill is invoked by its `name`, so two `SKILL.md` files that declare the same
name collide: discovery, activation, and tool routing cannot tell them apart,
and one silently shadows the other.

```text
.agents/skills/code-review/SKILL.md   name: code-review ─┐
agents/skills/code-review/SKILL.md    name: code-review ─┴─ collision
```

The rule reports each conflicting `SKILL.md` at its `name` line and lists the
other files sharing the name.

It stays silent when frontmatter cannot be parsed or has no string `name`.
Enable `skills/valid-frontmatter` to report those underlying problems.

## Options

Use `roots` to replace the default skill roots:

```json
{
	"skills/no-duplicate-skill-name": ["error", { "roots": ["company/skills"] }]
}
```

## References

- [Agent Skills specification](https://agentskills.io/specification)
