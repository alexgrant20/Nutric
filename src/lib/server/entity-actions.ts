import type { Db } from './db';
import type { Entity } from './entities';
import { readForm, toFormValues, validateForm, type FormErrors, type FormValues } from './entity-form';
import { saveEntity } from './entity-crud';
import { saveUpload, UploadError } from './upload';

export async function saveFromForm(
	db: Db, entity: Entity, id: number | null, fd: FormData, uploadRoot: string
): Promise<{ ok: true; id: number } | { ok: false; errors: FormErrors; initial: FormValues }> {
	const { parsed, files } = readForm(entity, fd);
	const errors = validateForm(entity, parsed);

	for (const f of entity.fields.filter((x) => x.type === 'image' || x.type === 'imageList')) {
		const incoming = files[f.name] ?? [];
		if (!incoming.length) continue;
		try {
			const paths: string[] = [];
			for (const file of incoming) paths.push(await saveUpload(file, entity.key.replace(/[^a-z]/g, ''), uploadRoot));
			if (f.type === 'image') parsed.base[f.name] = paths[0];
			else parsed.base[f.name] = [...((parsed.base[f.name] as string[]) ?? []), ...paths];
		} catch (e) {
			errors[`f.${f.name}`] = e instanceof UploadError ? e.message : 'The upload failed.';
		}
	}
	for (const f of entity.fields.filter((x) => x.type === 'image' && x.required)) {
		if (!parsed.base[f.name]) errors[`f.${f.name}`] = `${f.label} is required.`;
	}

	if (Object.keys(errors).length) return { ok: false, errors, initial: toFormValues(entity, parsed as any) };
	return { ok: true, id: saveEntity(db, entity, id, parsed) };
}
