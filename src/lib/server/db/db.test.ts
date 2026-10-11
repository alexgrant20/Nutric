import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createDb } from './index';
import * as s from './schema';

describe('database', () => {
	it('creates all tables from migrations', () => {
		const db = createDb(':memory:');
		expect(db.select().from(s.products).all()).toEqual([]);
		expect(db.select().from(s.pageSections).all()).toEqual([]);
	});

	it('cascades translation deletes with the base row', () => {
		const db = createDb(':memory:');
		const p = db.insert(s.products).values({ slug: 'a' }).returning().get();
		db.insert(s.productTranslations).values({ productId: p.id, lang: 'en', name: 'A' }).run();
		db.delete(s.products).where(eq(s.products.id, p.id)).run();
		expect(db.select().from(s.productTranslations).all()).toEqual([]);
	});

	it('rejects a second translation for the same language', () => {
		const db = createDb(':memory:');
		const p = db.insert(s.products).values({ slug: 'a' }).returning().get();
		db.insert(s.productTranslations).values({ productId: p.id, lang: 'en', name: 'A' }).run();
		expect(() =>
			db.insert(s.productTranslations).values({ productId: p.id, lang: 'en', name: 'B' }).run()
		).toThrow();
	});
});
