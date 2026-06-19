# `skills/valid-openai-metadata`

Validates the optional Codex `agents/openai.yaml` file when a skill provides
one. Skills without this OpenAI-specific extension remain valid.

The rule validates the documented `interface`, `policy`, and `dependencies`
field types, hexadecimal brand colours, icon paths, and MCP dependency entries.
Icon paths must resolve to files inside the skill directory.

Unknown fields are accepted by default for forward compatibility. Enable
`strict` to reject fields outside the currently documented schema:

```json
{
	"skills/valid-openai-metadata": ["warn", { "strict": true }]
}
```

Use `roots` alongside `strict` to replace the default skill roots.

Presentation recommendations such as quoted YAML strings, short-description
length, and default-prompt wording are intentionally documentation guidance,
not hard validation errors.

## References

- [Codex Agent Skills guide](https://developers.openai.com/codex/skills#optional-metadata)
- [OpenAI skill examples](https://github.com/openai/skills)
