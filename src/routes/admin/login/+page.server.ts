import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/env';
import { db } from '$lib/server/db/instance';
import { createSession, SESSION_DAYS } from '$lib/server/auth';
import { tryLogin } from '$lib/server/login';
import { RateLimiter } from '$lib/server/rate-limit';
import type { Actions, PageServerLoad } from './$types';

const limiter = new RateLimiter(5, 15 * 60_000);

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) throw redirect(303, '/admin');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const fd = await request.formData();
		const email = String(fd.get('email') ?? '').trim().toLowerCase();
		const result = await tryLogin(db, limiter, getClientAddress(), email, String(fd.get('password') ?? ''));
		if (!result.ok) {
			if (result.reason === 'blocked') return fail(429, { error: 'Too many attempts. Try again in 15 minutes.', email });
			return fail(400, { error: 'Email or password is incorrect.', email });
		}
		const { token } = createSession(db, result.userId);
		cookies.set('session', token, {
			path: '/', httpOnly: true, sameSite: 'lax', secure: !dev, maxAge: SESSION_DAYS * 86_400
		});
		throw redirect(303, '/admin');
	}
};
