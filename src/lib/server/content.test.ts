import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import * as c from './content';
import { seedFixture } from './test-fixtures';

let db: Db;
beforeEach(() => {
	db = createDb(':memory:');
	seedFixture(db);
});

describe('products', () => {
	it('returns only published products with a usable translation', () => {
		const list = c.getProducts(db, 'en');
		expect(list.map((p) => p.slug)).toEqual(['biospray', 'green-mix']);
	});
	it('uses the requested language and falls back to English per item', () => {
		const zh = c.getProducts(db, 'zh');
		expect(zh[0].t.name).toBe('生物喷雾');
		expect(zh[0].usedLang).toBe('zh');
		expect(zh[1].t.name).toBe('Green Mix');
		expect(zh[1].usedLang).toBe('en');
	});
	it('skips an item that has no English and no requested translation', () => {
		expect(c.getProducts(db, 'th').map((p) => p.slug)).not.toContain('zh-only');
		expect(c.getProducts(db, 'zh').map((p) => p.slug)).toContain('zh-only');
	});
	it('finds by slug, and returns null for unpublished or missing', () => {
		expect(c.getProductBySlug(db, 'en', 'biospray')?.t.name).toBe('BioSpray');
		expect(c.getProductBySlug(db, 'en', 'draft-product')).toBeNull();
		expect(c.getProductBySlug(db, 'en', 'nope')).toBeNull();
	});
	it('picks the best seller by sort order, ignoring unpublished', () => {
		expect(c.getBestSeller(db, 'en')?.slug).toBe('biospray');
	});
	it('returns null best seller when none is flagged', () => {
		db.update(schemaProducts()).set({ isBestSeller: false }).run();
		expect(c.getBestSeller(db, 'en')).toBeNull();
	});
});

describe('collections', () => {
	it('lists only collections that have a published product', () => {
		expect(c.getCollections(db, 'en').map((x) => x.slug)).toEqual(['revolutic']);
	});
});

describe('news', () => {
	it('lists published news newest first and paginates', () => {
		const p = c.getNewsPage(db, 'en', 1, 1);
		expect(p.total).toBe(2);
		expect(p.pages).toBe(2);
		expect(p.items[0].slug).toBe('news-newer');
		expect(c.getNewsPage(db, 'en', 2, 1).items[0].slug).toBe('news-older');
	});
	it('clamps an out-of-range page', () => {
		expect(c.getNewsPage(db, 'en', 99, 1).items[0].slug).toBe('news-older');
		expect(c.getNewsPage(db, 'en', -3, 1).items[0].slug).toBe('news-newer');
	});
	it('returns prev and next neighbours', () => {
		const r = c.getNewsBySlug(db, 'en', 'news-newer');
		expect(r?.prev).toBeNull();
		expect(r?.next?.slug).toBe('news-older');
	});
	it('hides drafts', () => expect(c.getNewsBySlug(db, 'en', 'news-draft')).toBeNull());
});

describe('landing', () => {
	it('shows all content sections for the fixture', () => {
		const d = c.getLandingData(db, 'en');
		expect(d.visible).toEqual(['hero', 'best_seller', 'collections', 'about', 'testimonials', 'accolades', 'news', 'newsletter']);
	});
	it('with nothing published shows only hero and newsletter and no nav', () => {
		db.update(schemaProducts()).set({ isPublished: false }).run();
		unpublishAll(db);
		const d = c.getLandingData(db, 'en');
		expect(d.visible).toEqual(['hero', 'newsletter']);
		expect(c.getChrome(db, 'en').nav).toEqual([]);
	});
});

import * as s from './db/schema';
function schemaProducts() {
	return s.products;
}
function unpublishAll(d: Db) {
	d.update(s.news).set({ status: 'draft' }).run();
	d.update(s.testimonials).set({ isPublished: false }).run();
	d.update(s.accolades).set({ isPublished: false }).run();
	d.update(s.siteSettingsTranslations).set({ aboutTeaserMd: null, aboutMd: null }).run();
}
