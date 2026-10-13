import { eq, gte, sql } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';
import type { DictKey } from '../i18n';

export const SECTION_KEYS = [
	'hero', 'best_seller', 'collections', 'testimonials', 'accolades', 'news', 'reviews', 'newsletter', 'about'
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export const DEFAULT_SECTIONS = SECTION_KEYS.map((key, position) => ({ key, position, isEnabled: true }));

export function ensureSections(db: Db): void {
	for (const row of DEFAULT_SECTIONS) {
		const exists = db.select().from(s.pageSections).where(eq(s.pageSections.key, row.key)).get();
		if (exists) continue;
		// A section added in a later release slots in at its default place instead of tying with an existing one.
		db.update(s.pageSections).set({ position: sql`${s.pageSections.position} + 1` }).where(gte(s.pageSections.position, row.position)).run();
		db.insert(s.pageSections).values(row).run();
	}
}

export function resolveVisibleSections(
	rows: { key: string; position: number; isEnabled: boolean }[],
	hasContent: Record<SectionKey, boolean>
): SectionKey[] {
	return rows
		.filter((r): r is typeof r & { key: SectionKey } => (SECTION_KEYS as readonly string[]).includes(r.key))
		.filter((r) => r.isEnabled && hasContent[r.key])
		.sort((a, b) => a.position - b.position)
		.map((r) => r.key);
}

export const NAV_ORDER: { key: SectionKey; labelKey: DictKey; path: string }[] = [
	{ key: 'collections', labelKey: 'nav.products', path: '/products' },
	{ key: 'testimonials', labelKey: 'nav.testimonials', path: '/videos' },
	{ key: 'reviews', labelKey: 'nav.reviews', path: '/testimonials' },
	{ key: 'accolades', labelKey: 'nav.accolades', path: '/accolades' },
	{ key: 'news', labelKey: 'nav.news', path: '/news' },
	{ key: 'about', labelKey: 'nav.about', path: '/about' }
];

export function navItemsFor(visible: SectionKey[]) {
	return NAV_ORDER.filter((n) => visible.includes(n.key));
}
