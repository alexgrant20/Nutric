import { asc } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { reorderSections } from '$lib/server/admin-misc';
import { ensureSections } from '$lib/server/sections';
import { getChrome } from '$lib/server/content';
import { redirect } from '@sveltejs/kit';

export const load = () => {
	ensureSections(db);
	const rows = db.select().from(s.pageSections).orderBy(asc(s.pageSections.position)).all();
	const visible = new Set(getChrome(db, 'en').visible);
	return { rows: rows.map((r) => ({ key: r.key, isEnabled: r.isEnabled, hasContent: visible.has(r.key as any) })) };
};

export const actions = {
	default: async ({ request }) => {
		const fd = await request.formData();
		reorderSections(db, fd.getAll('order').map(String), new Set(fd.getAll('enabled').map(String)));
		throw redirect(303, '/admin/sections');
	}
};
