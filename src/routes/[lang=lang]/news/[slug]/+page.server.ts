import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { getNewsBySlug } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const r = getNewsBySlug(db, params.lang as Lang, params.slug);
	if (!r) throw error(404);
	return { ...r, html: renderMarkdown(r.item.t.bodyMd) };
};
