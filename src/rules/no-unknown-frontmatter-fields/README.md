# `skills/no-unknown-frontmatter-fields`

Rejects `SKILL.md` frontmatter fields outside the Agent Skills specification.

The reference validator (`skills-ref`) treats unknown frontmatter fields as
errors, which catches typos like `descriptions:` that an agent would silently
ignore. The allowed top-level fields are:

`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`

`metadata` remains the open extension point for arbitrary custom data.

## Opt-in

This plugin is lenient by default and permits extension fields such as `paths`
or `globs`, so this rule is **excluded from the recommended preset**. Enable it
explicitly when a repository wants its frontmatter to match the specification
exactly:

```json
{
	"skills/no-unknown-frontmatter-fields": "error"
}
```

The rule stays silent when frontmatter is missing or invalid; enable
`skills/valid-frontmatter` for those.

## Options

Use `roots` to replace the default skill roots:

```json
{
	"skills/no-unknown-frontmatter-fields": ["error", { "roots": ["company/skills"] }]
}
```

## References

- [Agent Skills specification](https://agentskills.io/specification)
- [`skills-ref` reference validator](https://github.com/agentskills/agentskills/tree/main/skills-ref)
