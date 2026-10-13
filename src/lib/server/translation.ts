import { isLang, type Lang } from '../i18n/config';

// DeepL target codes per site language; the first one the account offers wins.
const targets: Record<Lang, string[]> = {
	en: ['EN-US', 'EN'], id: ['ID'], ms: ['MS'], zh: ['ZH-HANS', 'ZH'], 'zh-tw': ['ZH-HANT'], th: ['TH']
};
const sources: Record<Lang, string> = { en: 'EN', id: 'ID', ms: 'MS', zh: 'ZH', 'zh-tw': 'ZH', th: 'TH' };

export class UnsupportedLanguageError extends Error {}

function failure(status: number) {
	if (status === 403) return 'DeepL rejected the API key. Check DEEPL_API_KEY on the server.';
	if (status === 456) return 'The DeepL monthly character quota is used up.';
	if (status === 429) return 'DeepL is busy. Wait a moment and retry.';
	return 'DeepL could not translate this content. Retry later.';
}

// Translate prose separately so names, Markdown syntax, URLs and FAQ line breaks survive unchanged.
const protectedParts = /(\r?\n|https?:\/\/[^\s)]+|`[^`]*`|\]\([^)]*\)|[\[\]]|\*+|_+|^[ \t]*(?:#{1,6}\s+|[-+>]\s+|\d+\.\s+)|\b(?:Nutric|Revolutic|BioSpray|Vitanetic|Skinetique|Nanobelle)(?:[®™])?|[\p{L}\d-]+[®™]|\d+(?:[.,:/-]\d+)*|[®™])/gimu;

export async function translateFields(
	fields: Record<string, string>, source: Lang, target: Lang,
	options: { key: string; url?: string; fetch?: typeof fetch }
) {
	if (!isLang(source) || !isLang(target) || source === target) throw new Error('Choose different source and target languages.');
	if (!options.key) throw new Error('Set DEEPL_API_KEY on the server to enable automatic translation.');
	const request = options.fetch ?? fetch;
	// DeepL Free keys end in ":fx" and use a separate host.
	const base = (options.url ?? (options.key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com')).replace(/\/$/, '');
	const headers = { authorization: `DeepL-Auth-Key ${options.key}`, 'content-type': 'application/json' };
	const languagesResponse = await request(`${base}/v2/languages?type=target`, { headers, signal: AbortSignal.timeout(10_000) });
	if (!languagesResponse.ok) throw new Error(failure(languagesResponse.status));
	const offered = await languagesResponse.json() as { language: string }[];
	const to = targets[target].find((code) => offered.some((l) => l.language === code));
	if (!to) throw new UnsupportedLanguageError(`DeepL does not translate into ${target}.`);
	const from = sources[source];
	const chunks: string[] = [];
	const plans = Object.entries(fields).map(([name, value]) => ({ name, parts: value.split(protectedParts).filter((part) => part !== undefined).map((part, i) => {
		if (i % 2 === 1 || !/\p{L}/u.test(part)) return { text: part };
		const index = chunks.length;
		chunks.push(part.trim());
		return { index, before: part.match(/^\s*/)?.[0] ?? '', after: part.match(/\s*$/)?.[0] ?? '' };
	}) }));
	if (chunks.length > 500) throw new Error('Too much content. Translate a smaller item first.');
	if (!chunks.length) return fields;
	const translated: string[] = [];
	// DeepL accepts at most 50 texts per request.
	for (let i = 0; i < chunks.length; i += 50) {
		const batch = chunks.slice(i, i + 50);
		const response = await request(`${base}/v2/translate`, {
			method: 'POST', headers,
			body: JSON.stringify({ text: batch, source_lang: from, target_lang: to, preserve_formatting: true }),
			signal: AbortSignal.timeout(60_000)
		});
		if (!response.ok) throw new Error(failure(response.status));
		const result = await response.json() as { translations?: { text?: unknown }[] };
		if (!Array.isArray(result.translations) || result.translations.length !== batch.length || result.translations.some((t) => typeof t.text !== 'string')) {
			throw new Error('DeepL returned an incomplete response. No fields were changed.');
		}
		translated.push(...result.translations.map((t) => t.text as string));
	}
	return Object.fromEntries(plans.map(({ name, parts }) => [name, parts.map((p) => 'text' in p ? p.text : p.before + translated[p.index].trim() + p.after).join('')]));
}
