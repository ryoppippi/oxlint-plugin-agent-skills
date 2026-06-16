# `skills/skill-index-budget`

Limits the combined size of every skill `name` and `description`.

An agent loads the discovery metadata — the `name` and `description` of every
skill — all at once so it can decide which skill to activate. This "index" is
paid on every request and competes with the user's own context. As a repository
accumulates skills, the combined index can quietly grow large enough to crowd
out useful context.

This rule sums the `name` and `description` characters across every discovered
skill and reports a single finding when the total exceeds the budget. The
finding is anchored at the first skill (skills are sorted by path) because the
budget is a property of the whole collection; the message describes the
aggregate.

```text
agents/skills/a/SKILL.md:1 Combined skill index is 26500 characters across 18
skills; keep names and descriptions at or below 20000 characters …
```

Character count is a deliberately coarse, dependency-free proxy for token
usage. The default budget of 20000 characters is an operational safeguard, not
an Agent Skills specification limit.

## Options

- `maxCharacters` — the combined character budget. Defaults to `20000`.
- `roots` — replace the default skill roots.

```json
{
	"skills/skill-index-budget": ["warn", { "maxCharacters": 20000 }]
}
```

## References

- [Claude skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
