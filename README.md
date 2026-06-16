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
		"skills/max-skill-lines": "warn",
		"skills/no-deep-references": "warn",
	},
}
```

Oxlint derives the `skills` namespace from the `oxlint-plugin-skills` package
name.

By default, each rule scans these paths relative to the Oxlint working
directory:

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

| Rule                            | Checks                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `skills/valid-frontmatter`      | Valid YAML, required `name` and `description`, field lengths and types, naming syntax, XML tags, and reserved names |
| `skills/name-matches-directory` | Frontmatter `name` matches the directory containing `SKILL.md`                                                      |
| `skills/max-skill-lines`        | `SKILL.md` contains no more than 500 lines                                                                          |
| `skills/no-deep-references`     | Relative Markdown links, images, and definitions point no deeper than one directory below `SKILL.md`                |

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
- [Oxlint JavaScript plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins)

## License

MIT
