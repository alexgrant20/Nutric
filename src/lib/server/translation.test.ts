import { describe, it, expect, vi } from 'vitest';
import { translateFields, UnsupportedLanguageError } from './translation';

const offered = ['EN-US', 'ID', 'ZH-HANS', 'ZH-HANT', 'TH'].map((language) => ({ language }));
const options = (fetch: typeof globalThis.fetch) => ({ key: 'secret:fx', fetch });

function service(transform: (text: string) => string = (s) => s.toUpperCase()) {
	return vi.fn(async (url: string, init?: RequestInit) => {
		if (url.includes('/v2/languages')) return Response.json(offered);
		const body = JSON.parse(init!.body as string);
		return Response.json({ translations: body.text.map((text: string) => ({ text: transform(text) })) });
	}) as unknown as typeof fetch;
}
const sent = (request: typeof fetch, call = 1) => JSON.parse(vi.mocked(request).mock.calls[call][1]!.body as string);

describe('translation', () => {
	it('preserves Markdown, line breaks, numbers, brands and URLs', async () => {
		const result = await translateFields({ body: '## Welcome\n\n- Use Revolutic® BioSpray® 5 times.\n[Read more](https://nutric.com/en)' }, 'en', 'id', options(service()));
		expect(result.body).toBe('## WELCOME\n\n- USE Revolutic® BioSpray® 5 TIMES.\n[READ MORE](https://nutric.com/en)');
	});
	it('uses the free host and auth header for ":fx" keys', async () => {
		const request = service();
		await translateFields({ title: 'Welcome' }, 'en', 'id', options(request));
		const [url, init] = vi.mocked(request).mock.calls[1] as [string, RequestInit];
		expect(url).toBe('https://api-free.deepl.com/v2/translate');
		expect((init.headers as Record<string, string>).authorization).toBe('DeepL-Auth-Key secret:fx');
	});
	it('maps site languages to DeepL codes', async () => {
		const request = service();
		await translateFields({ title: 'Welcome' }, 'en', 'zh-tw', options(request));
		expect(sent(request)).toMatchObject({ source_lang: 'EN', target_lang: 'ZH-HANT' });
	});
	it('sends at most 50 texts per request', async () => {
		const request = service();
		const fields = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [`f${i}`, `Text ${i}`]));
		const result = await translateFields(fields, 'en', 'id', options(request));
		expect(vi.mocked(request).mock.calls.filter(([url]) => String(url).endsWith('/v2/translate'))).toHaveLength(3);
		expect(result.f119).toBe('TEXT 119');
	});
	it('rejects partial translations rather than corrupting fields', async () => {
		const request = vi.fn().mockResolvedValueOnce(Response.json(offered)).mockResolvedValueOnce(Response.json({ translations: [] }));
		await expect(translateFields({ title: 'Welcome' }, 'en', 'id', options(request))).rejects.toThrow('incomplete');
	});
	it('reports an unsupported language before translating', async () => {
		const request = vi.fn().mockResolvedValue(Response.json(offered));
		await expect(translateFields({ title: 'Welcome' }, 'en', 'ms', options(request))).rejects.toThrow(UnsupportedLanguageError);
		expect(request).toHaveBeenCalledTimes(1);
	});
	it('explains a rejected key and an exhausted quota', async () => {
		const status = (code: number) => vi.fn().mockResolvedValue(new Response('', { status: code }));
		await expect(translateFields({ title: 'Welcome' }, 'en', 'id', options(status(403)))).rejects.toThrow('API key');
		const quota = vi.fn().mockResolvedValueOnce(Response.json(offered)).mockResolvedValueOnce(new Response('', { status: 456 }));
		await expect(translateFields({ title: 'Welcome' }, 'en', 'id', options(quota))).rejects.toThrow('quota');
	});
	it('shows the HTTP status and DeepL message for other failures', async () => {
		const request = vi.fn().mockResolvedValue(Response.json({ message: 'Value for target_lang not supported.' }, { status: 400 }));
		await expect(translateFields({ title: 'Welcome' }, 'en', 'id', options(request))).rejects.toThrow('HTTP 400: Value for target_lang not supported.');
	});
	it('asks for a key when none is configured', async () => {
		await expect(translateFields({ title: 'Welcome' }, 'en', 'id', { key: '' })).rejects.toThrow('DEEPL_API_KEY');
	});
});
