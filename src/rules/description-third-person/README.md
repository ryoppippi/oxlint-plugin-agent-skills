# `skills/description-third-person`

Requires skill `description` fields to be written in the third person.

The description is injected into the system prompt so the agent can choose
between skills. Claude's authoring guidance requires the third person, because a
first- or second-person voice harms discovery.

```yaml
description: I can help you process Excel files   # reported
description: You can use this to process Excel files   # reported
description: Processes Excel files and generates reports   # accepted
```

## Scope (false-positive safety)

The rule flags a description **only** when its opening word is an unambiguous
first- or second-person pronoun (`I`, `we`, `you`, `your`, `my`, `our`, or
`let me`) immediately followed by a space or apostrophe. This intentionally:

- ignores mid-sentence pronouns;
- never matches imperative openings such as `Use when ...` (common and valid);
- never matches words that merely begin with those letters (`I/O`, `Identifies`).

It stays silent when the description is missing or invalid; enable
`skills/valid-frontmatter` for those.

## Options

Use `roots` to replace the default skill roots:

```json
{
	"skills/description-third-person": ["warn", { "roots": ["company/skills"] }]
}
```

## References

- [Claude skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
