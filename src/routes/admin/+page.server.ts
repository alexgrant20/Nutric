import { count, eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { ENTITIES } from '$lib/server/entities';
import { listEntities } from '$lib/server/entity-crud';

export const load = () => {
	const n = (t: any) => (db.select({ c: count() }).from(t).get()?.c ?? 0);
	// Per content type: how many items, how many are hidden from visitors, how many lack a translation.
	const content = (['products', 'collections', 'news', 'testimonials', 'accolades'] as const).map((key) => {
		const e = ENTITIES[key];
		const rows = listEntities(db, e, '');
		return {
			key,
			label: e.label,
			total: rows.length,
			hidden: rows.filter((r) => r.published === false).length,
			untranslated: rows.filter((r) => r.missing.length > 0).length
		};
	});
	return {
		content,
		subscribers: n(s.subscribers),
		drafts: db.select({ id: s.news.id, slug: s.news.slug }).from(s.news).where(eq(s.news.status, 'draft')).orderBy(desc(s.news.id)).limit(5).all()
	};
};
