import { error, redirect } from '@sveltejs/kit';
import { isLang } from '$lib/i18n/config';
import { parseAcceptLanguage } from '$lib/i18n/translate';

export const load = ({ request, params, url }) => {
	if (isLang(params.rest.split('/')[0].toLowerCase())) throw error(404);
	const lang = parseAcceptLanguage(request.headers.get('accept-language'));
	throw redirect(307, `/${lang}/${params.rest}${url.search}`);
};
