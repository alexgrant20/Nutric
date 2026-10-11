import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { getSettings } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const s = getSettings(db, params.lang as Lang);
	const md = s?.t?.aboutMd ?? s?.t?.aboutTeaserMd;
	if (!md) throw error(404);
	return { html: renderMarkdown(md) };
};
