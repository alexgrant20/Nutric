import { fail } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { changePassword } from '$lib/server/admin-misc';

export const actions = {
	default: async ({ request, locals, cookies }) => {
		const fd = await request.formData();
		const next = String(fd.get('next') ?? '');
		if (next !== String(fd.get('confirm') ?? '')) return fail(400, { error: 'The new passwords do not match.' });
		const res = await changePassword(db, locals.user!.id, String(fd.get('current') ?? ''), next);
		if (res === 'wrong-current') return fail(400, { error: 'The current password is incorrect.' });
		if (res === 'too-short') return fail(400, { error: 'The new password must be at least 12 characters.' });
		const keep = cookies.get('session');
		if (keep) {
			const { createHash } = await import('node:crypto');
			db.delete(s.sessions).where(and(eq(s.sessions.userId, locals.user!.id), ne(s.sessions.id, createHash('sha256').update(keep).digest('hex')))).run();
		}
		return { saved: true };
	}
};
