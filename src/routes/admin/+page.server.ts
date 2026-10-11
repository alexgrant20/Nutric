import { count, eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';

export const load = () => {
	const n = (t: any) => (db.select({ c: count() }).from(t).get()?.c ?? 0);
	return {
		counts: { products: n(s.products), collections: n(s.collections), news: n(s.news), testimonials: n(s.testimonials), accolades: n(s.accolades), subscribers: n(s.subscribers) },
		drafts: db.select({ id: s.news.id, slug: s.news.slug }).from(s.news).where(eq(s.news.status, 'draft')).orderBy(desc(s.news.id)).limit(5).all()
	};
};
