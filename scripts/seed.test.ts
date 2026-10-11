import { describe, expect, it } from 'vitest';
import { createDb } from '../src/lib/server/db';
import * as s from '../src/lib/server/db/schema';
import { getBestSeller, getChrome, getProducts } from '../src/lib/server/content';
import { loadSeed } from './seed';
import type { SeedData } from './seed-types';

const data: SeedData = {
	generatedAt: 'x',
	settings: {
		brandName: 'B', logoImage: 'logo.png', heroMedia: null, heroMediaType: 'image', heroProductImage: null,
		contactEmail: null, contactPhone: null, whatsappUrl: null, socialLinks: [],
		t: { en: { tagline: null, headlineLine1: 'A', headlineLine2: 'B', subheadline: null, ctaLabel: null, heroBadgeText: null, aboutTeaserMd: 'About', aboutMd: null, termsMd: null, aboutImageAlt: null, footerNote: null } }
	},
	collections: [{ slug: 'c', bannerImage: null, sortOrder: 0, t: { en: { name: 'C', tagline: null, description: null, bannerAlt: null } } }],
	products: [
		{ slug: 'p1', collectionSlug: 'c', mainImage: 'a.png', gallery: ['a.png'], isBestSeller: true, sortOrder: 0,
			t: { en: { name: 'P1', shortDescription: null, descriptionMd: null, benefits: ['x'], ingredientsMd: null, howToUseMd: null, faqs: [], regulatoryText: null, imageAlt: null } } }
	],
	news: [{ slug: 'n1', coverImage: null, eventDate: '2017-01-01', location: null, t: { en: { title: 'N', excerpt: null, bodyMd: null, coverAlt: null } } }],
	testimonials: [{ personName: null, role: null, youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ', sortOrder: 0, t: { en: { title: 'V', quote: null } } }],
	accolades: [{ image: 'acc.jpg', year: null, issuer: null, sortOrder: 0, t: { en: { title: 'Acc', description: null, imageAlt: null } } }]
};

describe('loadSeed', () => {
	it('inserts content that the content queries can read', () => {
		const db = createDb(':memory:');
		loadSeed(db, data);
		expect(getProducts(db, 'en')).toHaveLength(1);
		expect(getBestSeller(db, 'en')?.slug).toBe('p1');
		expect(getChrome(db, 'en').visible).toEqual(['hero', 'best_seller', 'collections', 'about', 'testimonials', 'accolades', 'news', 'newsletter']);
	});
	it('rewrites image file names to upload URLs', () => {
		const db = createDb(':memory:');
		loadSeed(db, data);
		expect(db.select().from(s.products).get()?.mainImage).toBe('/uploads/seed/a.png');
	});
	it('is repeatable', () => {
		const db = createDb(':memory:');
		loadSeed(db, data);
		loadSeed(db, data);
		expect(db.select().from(s.products).all()).toHaveLength(1);
	});
	it('skips testimonials whose URL is not a YouTube video', () => {
		const db = createDb(':memory:');
		loadSeed(db, { ...data, testimonials: [{ ...data.testimonials[0], youtubeUrl: 'https://evil.example/x' }] });
		expect(db.select().from(s.testimonials).all()).toHaveLength(0);
	});
});
