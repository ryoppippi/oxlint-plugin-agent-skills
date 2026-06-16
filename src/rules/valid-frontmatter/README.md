# `skills/valid-frontmatter`

Validates the YAML frontmatter used to discover an Agent Skill.

The rule checks:

- opening and closing `---` delimiters;
- valid YAML containing a key-value mapping;
- required `name` and `description` fields;
- name syntax, length, and reserved words;
- description type, length, and XML tags;
- optional `license`, `compatibility`, `metadata`, and `allowed-tools` fields.

Unknown extension fields are allowed so tools can add metadata such as `paths`
or `globs`.

## Options

Use `roots` to replace the default skill roots:

```json
{
	"skills/valid-frontmatter": ["error", { "roots": ["company/skills"] }]
}
```

## References

- [Agent Skills specification](https://agentskills.io/specification)
- [Claude skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
