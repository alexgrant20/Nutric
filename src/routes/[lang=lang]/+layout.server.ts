import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/instance';
import { getChrome } from '$lib/server/content';
import { LANGUAGES, type Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const lang = params.lang as Lang;
	const { settings, nav, visible } = getChrome(db, lang);
	const wa = settings?.whatsappUrl && /^https:\/\//.test(settings.whatsappUrl) ? settings.whatsappUrl : null;
	const contact =
		wa ?? (settings?.contactEmail ? `mailto:${settings.contactEmail}` : settings?.contactPhone ? `tel:${settings.contactPhone.replace(/[^\d+]/g, '')}` : null);
	return {
		lang, settings, nav, visible, contact,
		languages: LANGUAGES.filter((l) => l.enabled),
		newsletterEnabled: dev || env.NEWSLETTER_ENABLED === 'true'
	};
};
