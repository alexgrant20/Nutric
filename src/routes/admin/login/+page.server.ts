import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { createSession, SESSION_DAYS, verifyPassword } from '$lib/server/auth';
import { RateLimiter } from '$lib/server/rate-limit';
import type { Actions, PageServerLoad } from './$types';

const limiter = new RateLimiter(5, 15 * 60_000);
// Valid argon2 hash of a random string, used so unknown emails cost the same time as known ones.
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$q5rdmovKoo2WSx+DJxg38w$JkjmZt/bxHa8ZnElTZtDvZhgeGawEdrb3EqnCebkOeQ';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) throw redirect(303, '/admin');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const key = getClientAddress();
		if (limiter.isBlocked(key)) return fail(429, { error: 'Too many attempts. Try again in 15 minutes.' });
		const fd = await request.formData();
		const email = String(fd.get('email') ?? '').trim().toLowerCase();
		const password = String(fd.get('password') ?? '');
		const user = db.select().from(s.adminUsers).where(eq(s.adminUsers.email, email)).get();
		const ok = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, password);
		if (!user || !ok) {
			limiter.fail(key);
			return fail(400, { error: 'Email or password is incorrect.', email });
		}
		limiter.reset(key);
		const { token } = createSession(db, user.id);
		cookies.set('session', token, {
			path: '/', httpOnly: true, sameSite: 'lax', secure: !dev, maxAge: SESSION_DAYS * 86_400
		});
		throw redirect(303, '/admin');
	}
};
