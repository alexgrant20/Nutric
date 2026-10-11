import { error, json, redirect } from '@sveltejs/kit';
import { dev } from '$app/env';
import { NEWSLETTER_ENABLED } from '$app/env/private';
import { db } from '$lib/server/db/instance';
import { subscribe } from '$lib/server/subscribe';
import { RateLimiter } from '$lib/server/rate-limit';

const limiter = new RateLimiter(10, 60 * 60_000);

export const POST = async ({ request, getClientAddress }) => {
	if (!(dev || NEWSLETTER_ENABLED)) throw error(403, 'Newsletter is not enabled');
	const ip = getClientAddress();
	const wantsJson = request.headers.get('accept')?.includes('application/json');
	let status: string;
	if (limiter.isBlocked(ip)) status = 'failed';
	else {
		limiter.fail(ip);
		const fd = await request.formData();
		try {
			status = subscribe(db, String(fd.get('email') ?? ''), String(fd.get('lang') ?? 'en'));
		} catch (e) {
			console.error('subscribe failed', e);
			status = 'failed';
		}
	}
	if (wantsJson) return json({ status }, { status: status === 'failed' ? 500 : 200 });
	const back = new URL(request.headers.get('referer') ?? '/', request.url);
	back.searchParams.set('newsletter', status);
	throw redirect(303, back.pathname + back.search + '#newsletter');
};
