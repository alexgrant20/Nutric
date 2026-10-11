import { DEFAULT_LANG, enabledLangs, type Lang } from './config';

export function pickTranslation<T extends { lang: string }>(
	rows: T[],
	lang: Lang
): { row: T | null; usedLang: Lang | null } {
	const exact = rows.find((r) => r.lang === lang);
	if (exact) return { row: exact, usedLang: lang };
	const fallback = rows.find((r) => r.lang === DEFAULT_LANG);
	if (fallback) return { row: fallback, usedLang: DEFAULT_LANG };
	return { row: null, usedLang: null };
}

export function parseAcceptLanguage(header: string | null | undefined): Lang {
	if (!header) return DEFAULT_LANG;
	const enabled = enabledLangs();
	const tags = header
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().split(';');
			const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1);
			return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
		})
		.filter((x) => x.tag && x.tag !== '*')
		.sort((a, b) => b.q - a.q);
	for (const { tag } of tags) {
		if (tag === 'zh-tw' || tag === 'zh-hk' || tag === 'zh-hant' || tag.startsWith('zh-hant')) return 'zh-tw';
		const base = tag.split('-')[0];
		if (base === 'zh') return 'zh';
		if (enabled.includes(base as Lang)) return base as Lang;
	}
	return DEFAULT_LANG;
}
