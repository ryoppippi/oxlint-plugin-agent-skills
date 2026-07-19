# `skills/no-unknown-frontmatter-fields`

Rejects `SKILL.md` frontmatter fields outside the Agent Skills specification
and this rule's preset of known host extensions.

The reference validator (`skills-ref`) treats unknown frontmatter fields as
errors, which catches typos like `descriptions:` that an agent would silently
ignore. This rule's default preset is more lenient than that validator: it
combines the specification's fields with Claude Code's documented frontmatter
extensions, so enabling the rule does not force a repository to drop fields
Claude Code already understands.

Specification fields:

`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`

Claude Code extensions:

`agent`, `argument-hint`, `arguments`, `context`, `disable-model-invocation`,
`disallowed-tools`, `effort`, `hooks`, `model`, `paths`, `shell`,
`user-invocable`, `when_to_use`

`metadata` remains the open extension point for arbitrary custom data.

## Opt-in

This plugin is lenient by default and permits arbitrary extension fields, so
this rule is **excluded from the recommended preset**. Enable it explicitly
when a repository wants its frontmatter checked against the specification and
Claude Code's documented fields:

```json
{
	"skills/no-unknown-frontmatter-fields": "error"
}
```

The rule stays silent when frontmatter is missing or invalid; enable
`skills/valid-frontmatter` for those.

## Options

Use `roots` to replace the default skill roots, and `additionalFields` to
allow further top-level fields (other host extensions, or repository-specific
fields) without disabling the rule:

```json
{
	"skills/no-unknown-frontmatter-fields": [
		"error",
		{ "roots": ["company/skills"], "additionalFields": ["globs"] }
	]
}
```

## References

- [Agent Skills specification](https://agentskills.io/specification)
- [`skills-ref` reference validator](https://github.com/agentskills/agentskills/tree/main/skills-ref)
- [Claude Code skills frontmatter reference](https://code.claude.com/docs/en/skills)
