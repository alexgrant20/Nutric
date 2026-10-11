export const LANGUAGES = [
	{ code: 'en', label: 'English', htmlLang: 'en', enabled: true },
	{ code: 'ms', label: 'Bahasa Malaysia', htmlLang: 'ms', enabled: true },
	{ code: 'id', label: 'Indonesian', htmlLang: 'id', enabled: true },
	{ code: 'zh', label: '中文', htmlLang: 'zh-CN', enabled: true },
	{ code: 'zh-tw', label: '繁體中文', htmlLang: 'zh-TW', enabled: true },
	{ code: 'th', label: 'ไทย', htmlLang: 'th', enabled: true }
] as const;

export type Lang = (typeof LANGUAGES)[number]['code'];
export const DEFAULT_LANG: Lang = 'en';

export function enabledLangs(): Lang[] {
	return LANGUAGES.filter((l) => l.enabled).map((l) => l.code);
}
export function isLang(x: string): x is Lang {
	return enabledLangs().includes(x as Lang);
}
export function htmlLangFor(l: Lang): string {
	return LANGUAGES.find((x) => x.code === l)?.htmlLang ?? 'en';
}
