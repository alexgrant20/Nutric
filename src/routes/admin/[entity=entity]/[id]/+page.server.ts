import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/instance';
import { clientEntity, getEntity } from '$lib/server/entities';
import { loadEntity, relationOptions } from '$lib/server/entity-crud';
import { saveFromForm } from '$lib/server/entity-actions';
import { toFormValues } from '$lib/server/entity-form';
import { LANGUAGES } from '$lib/i18n/config';
import type { Actions, PageServerLoad } from './$types';

const parseId = (raw: string) => (raw === 'new' ? null : Number.isInteger(Number(raw)) ? Number(raw) : undefined);

export const load: PageServerLoad = ({ params }) => {
	const e = getEntity(params.entity);
	const id = parseId(params.id);
	if (!e || id === undefined) throw error(404);
	let rec = { base: {} as Record<string, any>, trs: {} as Record<string, Record<string, any>> };
	if (id !== null) {
		const found = loadEntity(db, e, id);
		if (!found) throw error(404);
		rec = found;
	} else {
		for (const f of e.fields) if (!f.translatable && f.type === 'boolean') rec.base[f.name] = f.name === 'isPublished';
	}
	return { entity: clientEntity(e), id, initial: toFormValues(e, rec), relations: relationOptions(db, e), languages: LANGUAGES.filter((l) => l.enabled) };
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const e = getEntity(params.entity)!;
		const id = parseId(params.id);
		if (id === undefined) throw error(404);
		const res = await saveFromForm(db, e, id, await request.formData(), env.UPLOAD_DIR ?? 'data/uploads');
		if (!res.ok) return fail(400, { errors: res.errors, initial: res.initial });
		throw redirect(303, `/admin/${e.key}?saved=1`);
	}
};
