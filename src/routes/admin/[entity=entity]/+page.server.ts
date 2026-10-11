import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { clientEntity, getEntity } from '$lib/server/entities';
import { deleteEntity, listEntities, toggleField } from '$lib/server/entity-crud';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
	const e = getEntity(params.entity);
	if (!e) throw error(404);
	return { entity: clientEntity(e), rows: listEntities(db, e, url.searchParams.get('q') ?? ''), q: url.searchParams.get('q') ?? '', saved: url.searchParams.get('saved') === '1' };
};

export const actions: Actions = {
	toggle: async ({ request, params }) => {
		const e = getEntity(params.entity)!;
		const fd = await request.formData();
		try { toggleField(db, e, Number(fd.get('id')), String(fd.get('field'))); } catch { return fail(400, { error: 'Could not update.' }); }
	},
	delete: async ({ request, params }) => {
		const e = getEntity(params.entity)!;
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Invalid item.' });
		deleteEntity(db, e, id);
	}
};
