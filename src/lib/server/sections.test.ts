import { describe, expect, it } from 'vitest';
import { navItemsFor, resolveVisibleSections, type SectionKey } from './sections';

const rows = [
	{ key: 'hero', position: 0, isEnabled: true },
	{ key: 'best_seller', position: 1, isEnabled: true },
	{ key: 'collections', position: 2, isEnabled: true },
	{ key: 'about', position: 3, isEnabled: false },
	{ key: 'testimonials', position: 4, isEnabled: true },
	{ key: 'accolades', position: 5, isEnabled: true },
	{ key: 'news', position: 6, isEnabled: true },
	{ key: 'newsletter', position: 7, isEnabled: true }
];
const all = (v: boolean) =>
	Object.fromEntries(rows.map((r) => [r.key, v])) as Record<SectionKey, boolean>;

describe('resolveVisibleSections', () => {
	it('keeps position order and drops disabled sections', () => {
		expect(resolveVisibleSections(rows, all(true))).toEqual([
			'hero', 'best_seller', 'collections', 'testimonials', 'accolades', 'news', 'newsletter'
		]);
	});
	it('drops sections without content', () => {
		const flags = { ...all(true), news: false, testimonials: false };
		expect(resolveVisibleSections(rows, flags)).not.toContain('news');
		expect(resolveVisibleSections(rows, flags)).not.toContain('testimonials');
	});
	it('respects a reordered position', () => {
		const re = rows.map((r) => (r.key === 'news' ? { ...r, position: -1 } : r));
		expect(resolveVisibleSections(re, all(true))[0]).toBe('news');
	});
	it('ignores unknown keys', () => {
		expect(resolveVisibleSections([{ key: 'bogus', position: 0, isEnabled: true }], all(true))).toEqual([]);
	});
});

describe('navItemsFor', () => {
	it('lists only visible content sections, in fixed order, with real paths', () => {
		const items = navItemsFor(['hero', 'news', 'collections', 'newsletter']);
		expect(items.map((i) => i.path)).toEqual(['/products', '/news']);
	});
	it('is empty when nothing but hero and newsletter is visible', () => {
		expect(navItemsFor(['hero', 'newsletter'])).toEqual([]);
	});
});
