# `skills/long-reference-has-toc`

Requires directly referenced long text files to include a linked table of
contents near the top. This helps agents understand the available sections when
a host previews only the beginning of a large reference.

The rule checks `.md`, `.mdx`, `.txt`, `.rst`, and `.adoc` link targets. It
ignores missing files so `skills/no-broken-local-references` can report that
underlying problem.

## Options

- `maxLines` — the maximum reference length without a table of contents.
  Defaults to `100`.
- `roots` — replace the default skill roots.

```json
{
	"skills/long-reference-has-toc": ["warn", { "maxLines": 100 }]
}
```

## References

- [Claude skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#structure-longer-reference-files-with-table-of-contents)
