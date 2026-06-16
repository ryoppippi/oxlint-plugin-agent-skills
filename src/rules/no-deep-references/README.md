# `skills/no-deep-references`

Requires relative Markdown references to point no deeper than one directory
below `SKILL.md`.

Valid:

```markdown
[Forms](FORMS.md)
[API](references/api.md)
```

Invalid:

```markdown
[API](references/platform/api.md)
```

The rule checks Markdown links, images, and definitions. It ignores external
URLs, absolute paths, fragments, and Markdown-looking text inside code blocks.

## Options

Use `roots` to replace the default skill roots:

```json
{
	"skills/no-deep-references": ["error", { "roots": ["company/skills"] }]
}
```

## References

- [Claude skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
