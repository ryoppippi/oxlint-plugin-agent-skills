# `skills/no-broken-local-references`

Requires relative Markdown references in `SKILL.md` to resolve to files inside
the skill directory.

The rule checks links, images, and link definitions. It accepts query strings
and fragments on existing files, and ignores external URLs, document-only
fragments, and Markdown-looking examples inside code blocks. References that
escape the skill directory, including through symlinks, are rejected.

## Options

Use `roots` to replace the default skill roots:

```json
{
	"skills/no-broken-local-references": ["error", { "roots": ["company/skills"] }]
}
```

## References

- [Agent Skills specification](https://agentskills.io/specification#file-references)
