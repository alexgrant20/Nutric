import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';
import { enabledLangs, type Lang } from '../i18n/config';
import { slugify } from '../slug';
import type { Entity } from './entities';
import type { ParsedForm } from './entity-form';

const nowSec = () => Math.floor(Date.now() / 1000);
const hasContent = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '' && v !== false);

function uniqueSlug(db: Db, entity: Entity, wanted: string): string {
	let slug = wanted;
	for (let n = 2; db.select().from(entity.table).where(eq(entity.table.slug, slug)).get(); n++) slug = `${wanted}-${n}`;
	return slug;
}

export function saveEntity(db: Db, entity: Entity, id: number | null, parsed: ParsedForm): number {
	return db.transaction((tx) => {
		const baseFields = entity.fields.filter((f) => !f.translatable).map((f) => f.name);
		const values: Record<string, unknown> = {};
		for (const name of baseFields) if (name in parsed.base) values[name] = parsed.base[name];
		let rowId = id;
		if (rowId == null) {
			if (entity.slugFrom) {
				const title = String(parsed.trs.en?.[entity.slugFrom] ?? '');
				values.slug = uniqueSlug(db, entity, slugify(title, `${entity.key}-${Date.now()}`));
			}
			rowId = (tx.insert(entity.table).values(values).returning({ id: entity.table.id }).get() as { id: number }).id;
		} else if ('updatedAt' in entity.table) {
			tx.update(entity.table).set({ ...values, updatedAt: nowSec() }).where(eq(entity.table.id, rowId)).run();
		} else {
			tx.update(entity.table).set(values).where(eq(entity.table.id, rowId)).run();
		}
		for (const lang of enabledLangs()) {
			const data = parsed.trs[lang];
			tx.delete(entity.trTable).where(and(eq(entity.trTable[entity.fk], rowId), eq(entity.trTable.lang, lang))).run();
			if (data && Object.values(data).some(hasContent)) {
				tx.insert(entity.trTable).values({ ...data, [entity.fk]: rowId, lang }).run();
			}
		}
		return rowId;
	});
}

export function loadEntity(db: Db, entity: Entity, id: number) {
	const base = db.select().from(entity.table).where(eq(entity.table.id, id)).get() as Record<string, any> | undefined;
	if (!base) return null;
	const rows = db.select().from(entity.trTable).where(eq(entity.trTable[entity.fk], id)).all() as Record<string, any>[];
	const trs: Record<string, Record<string, any>> = {};
	for (const r of rows) trs[r.lang] = r;
	return { base, trs };
}

export function listEntities(db: Db, entity: Entity, q: string) {
	const order = entity.order === 'date'
		? [desc(entity.table.eventDate), desc(entity.table.id)]
		: [asc(entity.table.sortOrder), asc(entity.table.id)];
	const bases = db.select().from(entity.table).orderBy(...order).all() as Record<string, any>[];
	const trs = bases.length
		? (db.select().from(entity.trTable).where(inArray(entity.trTable[entity.fk], bases.map((b) => b.id))).all() as Record<string, any>[])
		: [];
	const rows = bases.map((b) => {
		const mine = trs.filter((t) => t[entity.fk] === b.id);
		const title = (mine.find((t) => t.lang === 'en') ?? mine[0])?.[entity.titleField] ?? '(untitled)';
		const have = new Set(mine.map((t) => t.lang as Lang));
		return {
			id: b.id as number,
			title: String(title),
			thumb: entity.imageField ? ((b[entity.imageField] as string | null) ?? null) : null,
			published: entity.publish ? b[entity.publish.name] === entity.publish.on : null,
			bestSeller: 'isBestSeller' in b ? Boolean(b.isBestSeller) : null,
			sortOrder: (b.sortOrder as number | undefined) ?? null,
			missing: enabledLangs().filter((l) => !have.has(l))
		};
	});
	const needle = q.trim().toLowerCase();
	return needle ? rows.filter((r) => r.title.toLowerCase().includes(needle)) : rows;
}

export function deleteEntity(db: Db, entity: Entity, id: number): void {
	db.delete(entity.table).where(eq(entity.table.id, id)).run();
}

export function toggleField(db: Db, entity: Entity, id: number, field: string): void {
	const allowed = new Set<string>(['isBestSeller']);
	if (entity.publish) allowed.add(entity.publish.name);
	if (!allowed.has(field) || !entity.fields.some((f) => f.name === field)) throw new Error(`Field ${field} cannot be toggled`);
	const row = db.select().from(entity.table).where(eq(entity.table.id, id)).get() as Record<string, any> | undefined;
	if (!row) throw new Error('Not found');
	let next: unknown;
	if (entity.publish && field === entity.publish.name) next = row[field] === entity.publish.on ? entity.publish.off : entity.publish.on;
	else next = !row[field];
	db.update(entity.table).set({ [field]: next }).where(eq(entity.table.id, id)).run();
}

export function relationOptions(db: Db, entity: Entity): Record<string, { value: string; label: string }[]> {
	const out: Record<string, { value: string; label: string }[]> = {};
	if (entity.fields.some((f) => f.relation === 'collections')) {
		const cols = db.select().from(s.collections).orderBy(asc(s.collections.sortOrder)).all();
		const trs = db.select().from(s.collectionTranslations).all();
		out.collections = cols.map((c) => ({
			value: String(c.id),
			label: (trs.find((t) => t.collectionId === c.id && t.lang === 'en') ?? trs.find((t) => t.collectionId === c.id))?.name ?? c.slug
		}));
	}
	return out;
}
