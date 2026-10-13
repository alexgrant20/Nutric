import { describe, it, expect, vi } from 'vitest';
import { translateFields } from './translation';

function service(transform: (text: string) => string = (s) => s.toUpperCase()) {
	return vi.fn(async (url: string, init?: RequestInit) => {
		if (url.endsWith('/languages')) return Response.json(['en', 'id', 'ms', 'zh', 'zt', 'th'].map((code) => ({ code })));
		const body = JSON.parse(init!.body as string);
		return Response.json({ translatedText: body.q.map(transform) });
	}) as unknown as typeof fetch;
}
describe('translation', () => {
	it('preserves Markdown, line breaks, numbers, brands and URLs', async () => {
		const result = await translateFields({ body: '## Welcome\n\n- Use Revolutic® BioSpray® 5 times.\n[Read more](https://nutric.com/en)' }, 'en', 'id', { url: 'http://localhost:5000', fetch: service() });
		expect(result.body).toBe('## WELCOME\n\n- USE Revolutic® BioSpray® 5 TIMES.\n[READ MORE](https://nutric.com/en)');
	});
	it('maps traditional Chinese to the installed zt model', async () => {
		const request = service();
		await translateFields({ title: 'Welcome' }, 'en', 'zh-tw', { url: 'http://localhost:5000', fetch: request });
		expect(JSON.parse(vi.mocked(request).mock.calls[1][1]!.body as string).target).toBe('zt');
	});
	it('rejects partial translations rather than corrupting fields', async () => {
		const request = vi.fn().mockResolvedValueOnce(Response.json([{ code: 'en' }, { code: 'id' }])).mockResolvedValueOnce(Response.json({ translatedText: [] }));
		await expect(translateFields({ title: 'Welcome' }, 'en', 'id', { url: 'http://localhost:5000', fetch: request })).rejects.toThrow('incomplete');
	});
	it('reports a missing model before translating', async () => {
		const request = vi.fn().mockResolvedValue(Response.json([{ code: 'en' }]));
		await expect(translateFields({ title: 'Welcome' }, 'en', 'ms', { url: 'http://localhost:5000', fetch: request })).rejects.toThrow('no installed model');
		expect(request).toHaveBeenCalledTimes(1);
	});
});
