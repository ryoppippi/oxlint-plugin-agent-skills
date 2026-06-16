import { definePlugin } from '@oxlint/plugins';

import {
	maxSkillLinesRule,
	nameMatchesDirectoryRule,
	noDeepReferencesRule,
	validFrontmatterRule,
} from './rules.ts';

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
