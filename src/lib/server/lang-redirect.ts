import { isLang } from '../i18n/config';

const RESERVED = new Set(['admin', 'uploads', 'api', '_app', 'favicon.ico', 'robots.txt']);
const LOOKS_LIKE_LANG = /^[a-z]{2}(-[a-z]{2,4})?$/i;

export function unsupportedLangRedirect(pathname: string): string | null {
	const [, first, ...rest] = pathname.split('/');
	if (!first || RESERVED.has(first) || isLang(first.toLowerCase())) return null;
	if (!LOOKS_LIKE_LANG.test(first)) return null;
	return `/en${rest.length ? '/' + rest.join('/') : ''}`;
}
