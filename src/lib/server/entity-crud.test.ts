import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import * as s from './db/schema';
import { ENTITIES } from './entities';
import { deleteEntity, listEntities, loadEntity, saveEntity, toggleField } from './entity-crud';

let db: Db;
beforeEach(() => (db = createDb(':memory:')));

const news = ENTITIES.news;
const parsed = (title: string, extra: Record<string, unknown> = {}) => ({
	base: { status: 'draft', eventDate: null, location: null, coverImage: null, ...extra },
	trs: { en: { title } as Record<string, unknown> }
});

describe('saveEntity', () => {
	it('creates a row with a slug from the English title and its translation', () => {
		const id = saveEntity(db, news, null, parsed('Hello World'));
		expect(db.select().from(s.news).get()?.slug).toBe('hello-world');
		expect(loadEntity(db, news, id)?.trs.en.title).toBe('Hello World');
	});
	it('gives unique slugs for equal titles', () => {
		saveEntity(db, news, null, parsed('Same'));
		saveEntity(db, news, null, parsed('Same'));
		expect(db.select().from(s.news).all().map((r) => r.slug).sort()).toEqual(['same', 'same-2']);
	});
	it('gives a non-empty unique slug for titles without Latin letters', () => {
		saveEntity(db, news, null, parsed('金士力佳友'));
		saveEntity(db, news, null, parsed('น้ำท่วม'));
		const slugs = db.select().from(s.news).all().map((r) => r.slug);
		expect(slugs.every((x) => x.length > 0)).toBe(true);
		expect(new Set(slugs).size).toBe(2);
	});
	it('keeps the slug on update and replaces translations', () => {
		const id = saveEntity(db, news, null, parsed('First'));
		saveEntity(db, news, id, { base: { status: 'published' }, trs: { en: { title: 'Renamed' }, zh: { title: '改名' } } });
		expect(db.select().from(s.news).get()?.slug).toBe('first');
		expect(db.select().from(s.newsTranslations).all()).toHaveLength(2);
		saveEntity(db, news, id, { base: {}, trs: { en: { title: 'Renamed' } } });
		expect(db.select().from(s.newsTranslations).all()).toHaveLength(1);
	});
});

describe('list, toggle, delete', () => {
	it('lists with the English title and filters by search text', () => {
		saveEntity(db, news, null, parsed('Alpha'));
		saveEntity(db, news, null, parsed('Beta'));
		expect(listEntities(db, news, '').map((r) => r.title).sort()).toEqual(['Alpha', 'Beta']);
		expect(listEntities(db, news, 'alp').map((r) => r.title)).toEqual(['Alpha']);
	});
	it('toggles publish state', () => {
		const id = saveEntity(db, news, null, parsed('A'));
		toggleField(db, news, id, 'status');
		expect(db.select().from(s.news).get()?.status).toBe('published');
		toggleField(db, news, id, 'status');
		expect(db.select().from(s.news).get()?.status).toBe('draft');
	});
	it('refuses to toggle a field that is not toggleable', () => {
		const id = saveEntity(db, news, null, parsed('A'));
		expect(() => toggleField(db, news, id, 'slug')).toThrow();
	});
	it('deletes the row and its translations', () => {
		const id = saveEntity(db, news, null, parsed('A'));
		deleteEntity(db, news, id);
		expect(db.select().from(s.news).all()).toHaveLength(0);
		expect(db.select().from(s.newsTranslations).all()).toHaveLength(0);
	});
});
