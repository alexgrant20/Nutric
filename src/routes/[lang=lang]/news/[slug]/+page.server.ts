import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { getAllNews, getNewsBySlug } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const r = getNewsBySlug(db, params.lang as Lang, params.slug);
	if (!r) throw error(404);
	const others = getAllNews(db, params.lang as Lang).filter((n) => n.id !== r.item.id);
	return { ...r, others, html: renderMarkdown(r.item.t.bodyMd) };
};
