import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { deleteSession } from '$lib/server/auth';

export const load = () => { throw redirect(303, '/admin'); };
export const actions = {
	default: ({ cookies }) => {
		const token = cookies.get('session');
		if (token) deleteSession(db, token);
		cookies.delete('session', { path: '/' });
		throw redirect(303, '/admin/login');
	}
};
