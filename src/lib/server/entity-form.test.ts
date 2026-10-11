import { describe, expect, it } from 'vitest';
import { ENTITIES } from './entities';
import { faqsToText, parseFaqs, parseLines, readForm, validateForm } from './entity-form';

describe('parseFaqs / faqsToText', () => {
	it('parses blank-line separated blocks, first line is the question', () => {
		expect(parseFaqs('What?\nAnswer line 1\nline 2\n\nWhy?\nBecause')).toEqual([
			{ q: 'What?', a: 'Answer line 1\nline 2' },
			{ q: 'Why?', a: 'Because' }
		]);
	});
	it('ignores blocks without an answer and empty input', () => {
		expect(parseFaqs('Only a question')).toEqual([]);
		expect(parseFaqs('')).toEqual([]);
	});
	it('round-trips', () => {
		const faqs = [{ q: 'A?', a: 'B' }, { q: 'C?', a: 'D\nE' }];
		expect(parseFaqs(faqsToText(faqs))).toEqual(faqs);
	});
});

describe('parseLines', () => {
	it('splits, trims and drops blanks', () => expect(parseLines(' a \n\n b\r\nc ')).toEqual(['a', 'b', 'c']));
});

function fd(entries: [string, string][]): FormData {
	const f = new FormData();
	for (const [k, v] of entries) f.append(k, v);
	return f;
}

describe('readForm and validateForm (products)', () => {
	const e = ENTITIES.products;
	it('reads base and translated fields and coerces types', () => {
		const { parsed } = readForm(e, fd([
			['f.isPublished', 'on'], ['f.sortOrder', '3'], ['f.collectionId', ''],
			['t.en.name', ' BioSpray '], ['t.en.benefits', 'One\nTwo'], ['t.zh.name', '']
		]));
		expect(parsed.base.isPublished).toBe(true);
		expect(parsed.base.isBestSeller).toBe(false);
		expect(parsed.base.sortOrder).toBe(3);
		expect(parsed.base.collectionId).toBeNull();
		expect(parsed.trs.en?.name).toBe('BioSpray');
		expect(parsed.trs.en?.benefits).toEqual(['One', 'Two']);
	});
	it('requires the English name', () => {
		const { parsed } = readForm(e, fd([['t.en.name', '']]));
		expect(validateForm(e, parsed)['t.en.name']).toBeTruthy();
	});
	it('requires the name in another language once any field of it is filled', () => {
		const { parsed } = readForm(e, fd([['t.en.name', 'A'], ['t.th.shortDescription', 'only a description']]));
		expect(validateForm(e, parsed)['t.th.name']).toBeTruthy();
	});
	it('accepts a complete minimal form', () => {
		const { parsed } = readForm(e, fd([['t.en.name', 'A']]));
		expect(validateForm(e, parsed)).toEqual({});
	});
	it('rejects an image path that is not under /uploads/', () => {
		const { parsed } = readForm(e, fd([['t.en.name', 'A'], ['f.mainImage', 'https://evil.example/x.png']]));
		expect(parsed.base.mainImage).toBeNull();
	});
});

describe('testimonials', () => {
	const e = ENTITIES.testimonials;
	it('requires a valid YouTube URL', () => {
		const bad = readForm(e, fd([['t.en.title', 'T'], ['f.youtubeUrl', 'https://vimeo.com/1']])).parsed;
		expect(validateForm(e, bad)['f.youtubeUrl']).toBeTruthy();
		const ok = readForm(e, fd([['t.en.title', 'T'], ['f.youtubeUrl', 'https://youtu.be/dQw4w9WgXcQ']])).parsed;
		expect(validateForm(e, ok)).toEqual({});
	});
});

describe('news', () => {
	const e = ENTITIES.news;
	it('rejects a malformed date and an unknown status', () => {
		const p = readForm(e, fd([['t.en.title', 'T'], ['f.eventDate', '03/11/2017'], ['f.status', 'hacked']])).parsed;
		const errs = validateForm(e, p);
		expect(errs['f.eventDate']).toBeTruthy();
		expect(errs['f.status']).toBeTruthy();
	});
});
