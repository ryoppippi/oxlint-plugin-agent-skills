# `skills/no-windows-paths`

Requires forward slashes in `SKILL.md` file references.

Windows-style backslash paths break when an agent runs on a Unix system, so
references should always use forward slashes.

```text
See [the helper](scripts\helper.py)   ← reported
See [the helper](scripts/helper.py)   ← accepted
```

## Scope (false-positive safety)

The rule inspects **only parsed Markdown link, image, and definition targets** —
never prose or fenced/inline code. A backslash inside a code sample, regular
expression, or escape sequence is therefore never flagged. Protocol URLs,
absolute paths, and fragments are also left to other rules.

## Options

Use `roots` to replace the default skill roots:

```json
{
	"skills/no-windows-paths": ["error", { "roots": ["company/skills"] }]
}
```

## References

- [Claude skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
