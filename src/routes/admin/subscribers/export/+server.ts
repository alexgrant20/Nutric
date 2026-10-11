import { asc } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { csvEscape } from '$lib/server/admin-misc';

export const GET = () => {
	const rows = db.select().from(s.subscribers).orderBy(asc(s.subscribers.id)).all();
	const csv = ['email,language,date', ...rows.map((r) => [r.email, r.lang, new Date(r.createdAt * 1000).toISOString().slice(0, 10)].map(csvEscape).join(','))].join('\n');
	return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="subscribers.csv"' } });
};
