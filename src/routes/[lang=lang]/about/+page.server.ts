import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { getAccolades, getCollections, getProducts, getSettings, getTestimonials } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import type { Lang } from '$lib/i18n/config';

// The about text is one markdown document: an opening statement, then one "## heading" block per topic.
function splitSections(md: string) {
	const [intro, ...blocks] = md.split(/^## +/m);
	return {
		intro: renderMarkdown(intro),
		sections: blocks.map((b) => {
			const nl = b.indexOf('\n');
			const body = nl < 0 ? '' : b.slice(nl + 1).trim();
			return { title: (nl < 0 ? b : b.slice(0, nl)).trim(), html: renderMarkdown(body), short: body.length < 420 };
		})
	};
}

export const load = ({ params }) => {
	const lang = params.lang as Lang;
	const s = getSettings(db, lang);
	const md = s?.t?.aboutMd ?? s?.t?.aboutTeaserMd;
	if (!md) throw error(404);
	const accolades = getAccolades(db, lang);
	const years = accolades.map((a) => a.year).filter((y): y is number => y != null);
	return {
		...splitSections(md),
		stats: {
			products: getProducts(db, lang).length,
			collections: getCollections(db, lang).length,
			accolades: accolades.length,
			videos: getTestimonials(db, lang).length,
			since: years.length ? Math.min(...years) : null
		}
	};
};
