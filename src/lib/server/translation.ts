import { isLang, type Lang } from '../i18n/config';

const aliases: Record<Lang, string[]> = {
	en: ['en'], id: ['id'], ms: ['ms'], zh: ['zh', 'zh-CN', 'zh-Hans'],
	'zh-tw': ['zt', 'zh-TW', 'zh-Hant'], th: ['th']
};

// Translate prose separately so names, Markdown syntax, URLs and FAQ line breaks survive unchanged.
const protectedParts = /(\r?\n|https?:\/\/[^\s)]+|`[^`]*`|\]\([^)]*\)|[\[\]]|\*+|_+|^[ \t]*(?:#{1,6}\s+|[-+>]\s+|\d+\.\s+)|\b(?:Nutric|Revolutic|BioSpray|Vitanetic|Skinetique|Nanobelle)(?:[®™])?|[\p{L}\d-]+[®™]|\d+(?:[.,:/-]\d+)*|[®™])/gimu;

export async function translateFields(
	fields: Record<string, string>, source: Lang, target: Lang,
	options: { url: string; key?: string; fetch?: typeof fetch }
) {
	if (!isLang(source) || !isLang(target) || source === target) throw new Error('Choose different source and target languages.');
	const request = options.fetch ?? fetch;
	const base = options.url.replace(/\/$/, '');
	const languagesResponse = await request(`${base}/languages`, { signal: AbortSignal.timeout(10_000) });
	if (!languagesResponse.ok) throw new Error('LibreTranslate is unavailable. Start the translator service first.');
	const languages = await languagesResponse.json() as { code: string; targets?: string[] }[];
	const resolve = (lang: Lang) => aliases[lang].find((code) => languages.some((l) => l.code === code));
	const from = resolve(source), to = resolve(target);
	if (!from || !to || (languages.find((l) => l.code === from)?.targets && !languages.find((l) => l.code === from)!.targets!.includes(to))) {
		throw new Error(`The translator has no installed model for ${source} → ${target}.`);
	}
	const chunks: string[] = [];
	const plans = Object.entries(fields).map(([name, value]) => ({ name, parts: value.split(protectedParts).filter((part) => part !== undefined).map((part, i) => {
		if (i % 2 === 1 || !/\p{L}/u.test(part)) return { text: part };
		const index = chunks.length;
		chunks.push(part.trim());
		return { index, before: part.match(/^\s*/)?.[0] ?? '', after: part.match(/\s*$/)?.[0] ?? '' };
	}) }));
	if (chunks.length > 500) throw new Error('Too much content. Translate a smaller item first.');
	if (!chunks.length) return fields;
	const response = await request(`${base}/translate`, {
		method: 'POST', headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ q: chunks, source: from, target: to, format: 'text', ...(options.key ? { api_key: options.key } : {}) }),
		signal: AbortSignal.timeout(120_000)
	});
	if (!response.ok) throw new Error('LibreTranslate could not translate this content. Check the translator logs and retry.');
	const result = await response.json() as { translatedText: unknown };
	if (!Array.isArray(result.translatedText) || result.translatedText.length !== chunks.length || result.translatedText.some((s) => typeof s !== 'string')) {
		throw new Error('The translator returned an incomplete response. No fields were changed.');
	}
	const translated = result.translatedText as string[];
	return Object.fromEntries(plans.map(({ name, parts }) => [name, parts.map((p) => 'text' in p ? p.text : p.before + translated[p.index].trim() + p.after).join('')]));
}
