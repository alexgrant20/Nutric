import { expect, it } from 'vitest';
import { slugify } from './slug';

it('slugifies Latin text', () => expect(slugify('Revolutic® BioSpray® Plus!', 'x')).toBe('revolutic-biospray-plus'));
it('removes accents', () => expect(slugify('Café Éclair', 'x')).toBe('cafe-eclair'));
it('uses the fallback for text without Latin letters', () => {
	expect(slugify('金士力佳友与爱邻乐', 'news-7')).toBe('news-7');
	expect(slugify('น้ำท่วม', 'news-8')).toBe('news-8');
	expect(slugify('', 'news-9')).toBe('news-9');
});
it('caps the length', () => expect(slugify('a'.repeat(200), 'x').length).toBeLessThanOrEqual(80));
