import type { Lang } from './config';
import en from './en.json';
import ms from './ms.json';
import id from './id.json';
import zh from './zh.json';
import zhtw from './zh-tw.json';
import th from './th.json';

export type DictKey = keyof typeof en;
const DICTS: Record<Lang, Record<string, string>> = { en, ms, id, zh, 'zh-tw': zhtw, th };

export function t(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string {
	const raw = DICTS[lang]?.[key] ?? (en as Record<string, string>)[key] ?? key;
	return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : raw;
}
