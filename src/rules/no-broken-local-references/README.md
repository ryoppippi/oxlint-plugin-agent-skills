# `skills/no-broken-local-references`

Requires relative Markdown references in `SKILL.md` to resolve to an existing
file or directory inside the skill directory.

The rule checks links, images, and link definitions. It accepts query strings
and fragments on existing targets, and ignores external URLs, document-only
fragments, and Markdown-looking examples inside code blocks. Directory
references, such as a link to `references/`, are accepted as long as the
directory exists. References that escape the skill directory, including
through symlinks, are rejected by default.

## Options

Use `roots` to replace the default skill roots:

```json
{
	"skills/no-broken-local-references": ["error", { "roots": ["company/skills"] }]
}
```

Repositories that share reference files or link between skills — for example
`../clickhouse-query/SKILL.md` or `../../../references/testing/vitest.md` —
can set `allowOutsideSkillDirectory: true` to allow references outside the
skill directory. Existence is still checked, so a reference to a file or
directory that does not exist is reported either way:

```json
{
	"skills/no-broken-local-references": ["error", { "allowOutsideSkillDirectory": true }]
}
```

The default stays scoped to the skill directory so skills remain
self-contained and portable when copied elsewhere.

## References

- [Agent Skills specification](https://agentskills.io/specification#file-references)
