import { redirect, type Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { db } from '$lib/server/db/instance';
import { validateSession } from '$lib/server/auth';
import { unsupportedLangRedirect } from '$lib/server/lang-redirect';
import { htmlLangFor, isLang, type Lang } from '$lib/i18n/config';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	const fix = unsupportedLangRedirect(path);
	if (fix) throw redirect(308, fix + event.url.search);

	const token = event.cookies.get('session');
	event.locals.user = token ? validateSession(db, token) : null;

	if (path.startsWith('/admin') && path !== '/admin/login' && !event.locals.user) {
		throw redirect(303, '/admin/login');
	}

	const first = path.split('/')[1]?.toLowerCase() ?? '';
	const lang: Lang = isLang(first) ? first : 'en';
	event.locals.lang = lang;

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', htmlLangFor(lang))
	});
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	if (!dev) response.headers.set('Strict-Transport-Security', 'max-age=31536000');
	return response;
};
