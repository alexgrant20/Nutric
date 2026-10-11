import { describe, expect, it } from 'vitest';
import { enabledLangs, isLang } from './config';
import { parseAcceptLanguage, pickTranslation } from './translate';
import { t } from './index';
import en from './en.json';
import ms from './ms.json';
import id from './id.json';
import zh from './zh.json';
import zhtw from './zh-tw.json';
import th from './th.json';

describe('pickTranslation', () => {
	const rows = [
		{ lang: 'en', name: 'E' },
		{ lang: 'zh', name: 'Z' }
	];
	it('returns the requested language', () => {
		expect(pickTranslation(rows, 'zh')).toEqual({ row: rows[1], usedLang: 'zh' });
	});
	it('falls back to English and reports it', () => {
		expect(pickTranslation(rows, 'th')).toEqual({ row: rows[0], usedLang: 'en' });
	});
	it('returns null when neither exists', () => {
		expect(pickTranslation([{ lang: 'zh', name: 'Z' }], 'th')).toEqual({ row: null, usedLang: null });
	});
});

describe('parseAcceptLanguage', () => {
	it.each([
		['zh-TW,zh;q=0.9,en;q=0.8', 'zh-tw'],
		['zh-CN,zh;q=0.9', 'zh'],
		['id-ID,id;q=0.9', 'id'],
		['ms-MY', 'ms'],
		['th', 'th'],
		['fr-FR,fr;q=0.9', 'en'],
		['', 'en'],
		[null, 'en'],
		['*', 'en'],
		['garbage;;;', 'en']
	])('%s -> %s', (header, expected) => {
		expect(parseAcceptLanguage(header as string | null)).toBe(expected);
	});
});

describe('config', () => {
	it('knows the six languages', () => {
		expect(enabledLangs()).toEqual(['en', 'ms', 'id', 'zh', 'zh-tw', 'th']);
		expect(isLang('zh-tw')).toBe(true);
		expect(isLang('xx')).toBe(false);
	});
});

describe('dictionaries', () => {
	const dicts = { ms, id, zh, 'zh-tw': zhtw, th } as Record<string, Record<string, string>>;
	it('all languages have exactly the English key set', () => {
		for (const [code, d] of Object.entries(dicts)) {
			expect(Object.keys(d).sort(), code).toEqual(Object.keys(en).sort());
		}
	});
	it('contains no em dash and no empty values', () => {
		for (const d of [en, ...Object.values(dicts)] as Record<string, string>[]) {
			for (const v of Object.values(d)) {
				expect(v).not.toContain('\u2014');
				expect(v.trim().length).toBeGreaterThan(0);
			}
		}
	});
	it('interpolates variables', () => {
		expect(t('en', 'hero.cta', { name: 'BioSpray' })).toBe('See BioSpray');
	});
	it('falls back to English for an unknown key', () => {
		// @ts-expect-error deliberately invalid key
		expect(t('th', 'nope.key')).toBe('nope.key');
	});
});
