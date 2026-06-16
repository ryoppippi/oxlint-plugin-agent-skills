import { definePlugin } from '@oxlint/plugins';

import { maxSkillLinesRule } from './rules/max-skill-lines.ts';
import { nameMatchesDirectoryRule } from './rules/name-matches-directory.ts';
import { noDeepReferencesRule } from './rules/no-deep-references.ts';
import { validFrontmatterRule } from './rules/valid-frontmatter.ts';

const plugin = definePlugin({
	meta: {
		name: 'oxlint-plugin-skills',
	},
	rules: {
		'max-skill-lines': maxSkillLinesRule,
		'name-matches-directory': nameMatchesDirectoryRule,
		'no-deep-references': noDeepReferencesRule,
		'valid-frontmatter': validFrontmatterRule,
	},
});

export default plugin;
