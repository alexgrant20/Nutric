import { redirect } from '@sveltejs/kit';
import { parseAcceptLanguage } from '$lib/i18n/translate';

export const load = ({ request }) => {
	throw redirect(307, `/${parseAcceptLanguage(request.headers.get('accept-language'))}`);
};
