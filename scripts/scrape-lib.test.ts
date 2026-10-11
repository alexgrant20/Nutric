import { describe, expect, it } from 'vitest';
import {
	aboutToMarkdown, collectionSlugFor, newsBodyFromI18n, parseNewsDate, regulatoryExpiry, faqsFromPairs, splitBenefits
} from './scrape-lib';

describe('parseNewsDate', () => {
	it.each([
		['3rd Nov 2017', '2017-11-03'],
		['16th Jan 2017', '2017-01-16'],
		['1st Feb 2016', '2016-02-01'],
		['22nd Dec 2015', '2015-12-22'],
		['garbage', null]
	])('%s -> %s', (input, expected) => expect(parseNewsDate(input)).toBe(expected));
});

describe('newsBodyFromI18n', () => {
	const news = { NEWS1: 'T', NEWS1SHORTDESC: 'S', NEWS1LONGDESC1: 'P1', NEWS1LONGDESC2: 'P2', NEWS2: 'T2' };
	it('joins long descriptions in order as markdown paragraphs', () => {
		expect(newsBodyFromI18n(news, 1)).toEqual({ title: 'T', excerpt: 'S', bodyMd: 'P1\n\nP2' });
	});
	it('returns null body when no long description exists', () => {
		expect(newsBodyFromI18n(news, 2)).toEqual({ title: 'T2', excerpt: null, bodyMd: null });
	});
	it('returns null for a missing item', () => expect(newsBodyFromI18n(news, 9)).toBeNull());
});

describe('collectionSlugFor', () => {
	it('matches brand prefixes', () => {
		expect(collectionSlugFor('Revolutic® BioSpray®')).toBe('revolutic');
		expect(collectionSlugFor('Vitanetic® Green Mix')).toBe('vitanetic');
		expect(collectionSlugFor('Skinetique® Nanobelle')).toBe('skinetique');
		expect(collectionSlugFor('Unknown')).toBeNull();
	});
});

describe('regulatoryExpiry', () => {
	it('finds a dd/mm/yyyy date in the text', () => {
		expect(regulatoryExpiry('MAL1\nAdvertisement Expiry Date: 31/12/2025')).toBe('2025-12-31');
	});
	it('returns null when absent', () => expect(regulatoryExpiry('MAL1')).toBeNull());
});

describe('faqsFromPairs', () => {
	it('drops pairs with an empty question or answer and trims', () => {
		expect(faqsFromPairs([[' Q1 ', ' A1 '], ['', 'x'], ['Q2', '']])).toEqual([{ q: 'Q1', a: 'A1' }]);
	});
});

describe('splitBenefits', () => {
	it('extracts list items from description HTML', () => {
		const html = '<p>Intro</p><p><b>Benefits:</b></p><ul><li>One</li><li> Two </li></ul>';
		expect(splitBenefits(html)).toEqual({ descriptionHtml: '<p>Intro</p>', benefits: ['One', 'Two'] });
	});
	it('returns the html untouched when there is no list', () => {
		expect(splitBenefits('<p>Only</p>')).toEqual({ descriptionHtml: '<p>Only</p>', benefits: [] });
	});
});

describe('aboutToMarkdown', () => {
	it('builds sections from the ABOUTUS keys that exist', () => {
		const md = aboutToMarkdown({
			'NUTRIC-1': 'Intro 1', 'NUTRIC-2': 'Intro 2', OURMISSION: 'Our Mission', 'MISSION-1': 'Mission text'
		});
		expect(md).toContain('Intro 1');
		expect(md).toContain('## Our Mission\n\nMission text');
	});
	it('returns null for empty input', () => expect(aboutToMarkdown({})).toBeNull());
});
