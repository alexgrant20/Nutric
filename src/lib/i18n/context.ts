import { getContext, setContext } from 'svelte';
import type { Lang } from './config';
import { t as translate, type DictKey } from './index';

export type TFn = (key: DictKey, vars?: Record<string, string | number>) => string;

export function provideT(getLang: () => Lang): TFn {
	const fn: TFn = (key, vars) => translate(getLang(), key, vars);
	setContext('t', fn);
	return fn;
}
export const useT = () => getContext<TFn>('t');
