# oxlint-plugin-skills

Oxlint JavaScript plugin for validating
[Agent Skills](https://agentskills.io/specification) and Claude skill authoring
conventions.

## Install

```sh
pnpm add -D oxlint oxlint-plugin-skills
```

## Configure

```jsonc
{
	"jsPlugins": ["oxlint-plugin-skills"],
	"rules": {
		"skills/valid-frontmatter": "error",
		"skills/name-matches-directory": "error",
		"skills/no-duplicate-skill-name": "error",
		"skills/no-empty-skill-body": "error",
		"skills/skill-index-budget": ["warn", { "maxCharacters": 20000 }],
		"skills/max-skill-lines": ["warn", { "maxLines": 220 }],
		"skills/no-deep-references": "warn",
		"skills/no-windows-paths": "warn",
		"skills/description-third-person": "warn",
		// Opt-in: stricter than this plugin's default leniency.
		"skills/no-unknown-frontmatter-fields": "off",
	},
}
```

Oxlint derives the `skills` namespace from the `oxlint-plugin-skills` package
name.

By default, each rule scans these paths relative to the Oxlint working
directory:

- `.agent/skills`
- `.agents/skills`
- `agents/skills`
- `skills`

Configure other skill roots through the rule option:

```jsonc
{
	"rules": {
		"skills/valid-frontmatter": [
			"error",
			{
				"roots": ["company/agent-skills"],
			},
		],
	},
}
```

Apply the same `roots` option to each enabled rule that should inspect a custom
location.

## Rules

| Rule                                                                                        | Checks                                                                                                              |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [`skills/valid-frontmatter`](src/rules/valid-frontmatter/README.md)                         | Valid YAML, required `name` and `description`, field lengths and types, naming syntax, XML tags, and reserved names |
| [`skills/name-matches-directory`](src/rules/name-matches-directory/README.md)               | Frontmatter `name` matches the directory containing `SKILL.md`                                                      |
| [`skills/no-duplicate-skill-name`](src/rules/no-duplicate-skill-name/README.md)             | Frontmatter `name` is unique across all configured skill roots                                                      |
| [`skills/no-empty-skill-body`](src/rules/no-empty-skill-body/README.md)                     | `SKILL.md` includes instructions after its frontmatter                                                              |
| [`skills/skill-index-budget`](src/rules/skill-index-budget/README.md)                       | Combined `name` and `description` size across all skills stays within a configurable character budget               |
| [`skills/max-skill-lines`](src/rules/max-skill-lines/README.md)                             | `SKILL.md` stays within a configurable line limit, defaulting to 220                                                |
| [`skills/no-deep-references`](src/rules/no-deep-references/README.md)                       | Relative Markdown links, images, and definitions point no deeper than one directory below `SKILL.md`                |
| [`skills/no-windows-paths`](src/rules/no-windows-paths/README.md)                           | Relative Markdown reference targets use forward slashes, not Windows-style backslashes                              |
| [`skills/description-third-person`](src/rules/description-third-person/README.md)           | `description` is written in the third person, not first or second person                                            |
| [`skills/no-unknown-frontmatter-fields`](src/rules/no-unknown-frontmatter-fields/README.md) | Frontmatter has no fields outside the specification (opt-in; not in the recommended preset)                         |

The 220-line limit is an operational safeguard based on a
[community analysis of Codex skill reads](https://www.reddit.com/r/codex/comments/1t1rbqt/codex_may_only_read_the_first_220_lines_of_a/).
The observed median initial read was 220 lines across several model
configurations; this is not an Agent Skills specification limit.

Diagnostics are attached to the JavaScript or TypeScript file Oxlint is
visiting, while each message starts with the actual `SKILL.md` path and line:

```text
.agents/skills/example/SKILL.md:2 Frontmatter requires a description field.
```

Oxlint does not currently pass Markdown files to JavaScript plugins. Run
Oxlint against at least one JavaScript or TypeScript file so the plugin can
scan the configured skill roots.

## Sources

- [Agent Skills specification](https://agentskills.io/specification)
- [Claude skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Codex 220-line skill read analysis](https://www.reddit.com/r/codex/comments/1t1rbqt/codex_may_only_read_the_first_220_lines_of_a/)
- [Oxlint JavaScript plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins)

## License

MIT
