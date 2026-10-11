import { expect, it } from 'vitest';
import { formatDate } from './format';

it('formats an ISO date in the language', () => {
	expect(formatDate('2017-11-03', 'en')).toBe('November 3, 2017');
	expect(formatDate('2017-11-03', 'id')).toContain('2017');
});
it('returns an empty string for null or invalid input', () => {
	expect(formatDate(null, 'en')).toBe('');
	expect(formatDate('not-a-date', 'en')).toBe('');
});
