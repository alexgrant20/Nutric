import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';
import { pickTranslation } from '../i18n/translate';
import type { Lang } from '../i18n/config';
import { navItemsFor, resolveVisibleSections, type SectionKey } from './sections';

export type Localized<B, T> = B & { t: T; usedLang: Lang };

function groupBy<T>(rows: T[], key: (r: T) => number): Map<number, T[]> {
	const m = new Map<number, T[]>();
	for (const r of rows) {
		const k = key(r);
		const list = m.get(k);
		if (list) list.push(r);
		else m.set(k, [r]);
	}
	return m;
}

function localize<B extends { id: number }, T extends { lang: string }>(
	bases: B[],
	trs: Map<number, T[]>,
	lang: Lang
): Localized<B, T>[] {
	const out: Localized<B, T>[] = [];
	for (const b of bases) {
		const p = pickTranslation(trs.get(b.id) ?? [], lang);
		if (p.row) out.push({ ...b, t: p.row, usedLang: p.usedLang! });
	}
	return out;
}

// ---------- products ----------
export function getProducts(db: Db, lang: Lang, o: { collectionId?: number; excludeId?: number; limit?: number } = {}) {
	const where = o.collectionId != null
		? and(eq(s.products.isPublished, true), eq(s.products.collectionId, o.collectionId))
		: eq(s.products.isPublished, true);
	const bases = db.select().from(s.products).where(where).orderBy(asc(s.products.sortOrder), asc(s.products.id)).all()
		.filter((p) => p.id !== o.excludeId);
	const trs = groupBy(
		bases.length ? db.select().from(s.productTranslations).where(inArray(s.productTranslations.productId, bases.map((b) => b.id))).all() : [],
		(r) => r.productId
	);
	const list = localize(bases, trs, lang);
	return o.limit ? list.slice(0, o.limit) : list;
}
export type ProductView = ReturnType<typeof getProducts>[number];

export function getProductBySlug(db: Db, lang: Lang, slug: string): ProductView | null {
	return getProducts(db, lang).find((p) => p.slug === slug) ?? null;
}
export function getBestSeller(db: Db, lang: Lang): ProductView | null {
	return getProducts(db, lang).find((p) => p.isBestSeller) ?? null;
}

// ---------- collections ----------
export function getCollections(db: Db, lang: Lang) {
	const products = getProducts(db, lang);
	const bases = db.select().from(s.collections).orderBy(asc(s.collections.sortOrder), asc(s.collections.id)).all()
		.filter((c) => products.some((p) => p.collectionId === c.id));
	const trs = groupBy(
		bases.length ? db.select().from(s.collectionTranslations).where(inArray(s.collectionTranslations.collectionId, bases.map((b) => b.id))).all() : [],
		(r) => r.collectionId
	);
	return localize(bases, trs, lang).map((c) => ({ ...c, productCount: products.filter((p) => p.collectionId === c.id).length }));
}
export function getCollectionBySlug(db: Db, lang: Lang, slug: string) {
	return getCollections(db, lang).find((c) => c.slug === slug) ?? null;
}

// ---------- news ----------
function allNews(db: Db, lang: Lang) {
	const bases = db.select().from(s.news).where(eq(s.news.status, 'published'))
		.orderBy(desc(s.news.eventDate), desc(s.news.id)).all();
	const trs = groupBy(
		bases.length ? db.select().from(s.newsTranslations).where(inArray(s.newsTranslations.newsId, bases.map((b) => b.id))).all() : [],
		(r) => r.newsId
	);
	return localize(bases, trs, lang);
}
export type NewsView = ReturnType<typeof allNews>[number];

export function getNewsPage(db: Db, lang: Lang, page: number, perPage: number) {
	const all = allNews(db, lang);
	const pages = Math.max(1, Math.ceil(all.length / perPage));
	const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
	return { items: all.slice((current - 1) * perPage, current * perPage), total: all.length, pages, page: current };
}
export function getNewsBySlug(db: Db, lang: Lang, slug: string) {
	const all = allNews(db, lang);
	const i = all.findIndex((n) => n.slug === slug);
	if (i < 0) return null;
	return { item: all[i], prev: all[i - 1] ?? null, next: all[i + 1] ?? null };
}

// ---------- testimonials and accolades ----------
export function getTestimonials(db: Db, lang: Lang) {
	const bases = db.select().from(s.testimonials).where(eq(s.testimonials.isPublished, true))
		.orderBy(asc(s.testimonials.sortOrder), asc(s.testimonials.id)).all();
	const trs = groupBy(
		bases.length ? db.select().from(s.testimonialTranslations).where(inArray(s.testimonialTranslations.testimonialId, bases.map((b) => b.id))).all() : [],
		(r) => r.testimonialId
	);
	return localize(bases, trs, lang);
}
export function getAccolades(db: Db, lang: Lang) {
	const bases = db.select().from(s.accolades).where(eq(s.accolades.isPublished, true))
		.orderBy(asc(s.accolades.year), asc(s.accolades.sortOrder), asc(s.accolades.id)).all();
	const trs = groupBy(
		bases.length ? db.select().from(s.accoladeTranslations).where(inArray(s.accoladeTranslations.accoladeId, bases.map((b) => b.id))).all() : [],
		(r) => r.accoladeId
	);
	return localize(bases, trs, lang);
}

// ---------- settings, chrome, landing ----------
export function getSettings(db: Db, lang: Lang) {
	const base = db.select().from(s.siteSettings).where(eq(s.siteSettings.id, 1)).get();
	if (!base) return null;
	const trs = db.select().from(s.siteSettingsTranslations).all();
	const p = pickTranslation(trs, lang);
	const english = trs.find((r) => r.lang === 'en') ?? null;
	// Settings have many independent fields: fall back to English per field, not per language row.
	let t = p.row;
	if (p.row && english && p.row !== english) {
		const merged: Record<string, unknown> = { ...p.row };
		for (const key of Object.keys(english)) {
			if (key === 'id' || key === 'lang') continue;
			const own = merged[key];
			if (own == null || (typeof own === 'string' && own.trim() === '')) merged[key] = (english as Record<string, unknown>)[key];
		}
		t = merged as typeof p.row;
	}
	return { ...base, t, usedLang: p.usedLang };
}

function contentFlags(db: Db, lang: Lang, settings: ReturnType<typeof getSettings>) {
	const flags: Record<SectionKey, boolean> = {
		hero: !!settings,
		best_seller: getBestSeller(db, lang) != null,
		collections: getProducts(db, lang).length > 0,
		about: !!settings?.t?.aboutTeaserMd?.trim(),
		testimonials: getTestimonials(db, lang).length > 0,
		accolades: getAccolades(db, lang).length > 0,
		news: getNewsPage(db, lang, 1, 1).total > 0,
		newsletter: true
	};
	return flags;
}

export function getChrome(db: Db, lang: Lang) {
	const settings = getSettings(db, lang);
	const rows = db.select().from(s.pageSections).all();
	const visible = resolveVisibleSections(rows, contentFlags(db, lang, settings));
	return { settings, visible, nav: navItemsFor(visible) };
}

export function getLandingData(db: Db, lang: Lang) {
	const { settings, visible, nav } = getChrome(db, lang);
	return {
		settings, visible, nav,
		bestSeller: getBestSeller(db, lang),
		collections: getCollections(db, lang),
		products: getProducts(db, lang),
		testimonials: getTestimonials(db, lang),
		accolades: getAccolades(db, lang),
		news: getNewsPage(db, lang, 1, 3).items
	};
}
