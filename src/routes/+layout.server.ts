import { db } from '$lib/server/db/instance';
import { getSettings } from '$lib/server/content';
import { DEFAULT_THEME, themeToCss, validateTheme } from '$lib/theme/tokens';

export const load = () => {
	const stored = getSettings(db, 'en')?.theme;
	const checked = stored ? validateTheme(stored) : null;
	return { themeCss: themeToCss(checked?.ok ? checked.theme : DEFAULT_THEME) };
};
