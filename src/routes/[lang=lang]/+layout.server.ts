import { dev } from '$app/env';
import { NEWSLETTER_ENABLED } from '$app/env/private';
import { db } from '$lib/server/db/instance';
import { getAccolades, getChrome, getProducts, getTestimonials } from '$lib/server/content';
import { LANGUAGES, type Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const lang = params.lang as Lang;
	const { settings, nav, visible } = getChrome(db, lang);
	const wa = settings?.whatsappUrl && /^https:\/\//.test(settings.whatsappUrl) ? settings.whatsappUrl : null;
	const contact =
		wa ?? (settings?.contactEmail ? `mailto:${settings.contactEmail}` : settings?.contactPhone ? `tel:${settings.contactPhone.replace(/[^\d+]/g, '')}` : null);
	return {
		lang, settings, nav, visible, contact,
		exploreCounts: {
			'/products': getProducts(db, lang).length,
			'/videos': getTestimonials(db, lang).length,
			'/testimonials': getTestimonials(db, lang, 'testimonial').length,
			'/accolades': getAccolades(db, lang).length
		},
		languages: LANGUAGES.filter((l) => l.enabled),
		newsletterEnabled: dev || NEWSLETTER_ENABLED
	};
};
