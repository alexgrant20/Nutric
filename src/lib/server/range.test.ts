import { describe, expect, it } from 'vitest';
import { parseRange } from './range';

describe('parseRange', () => {
	it.each([
		['bytes=0-99', 1000, { start: 0, end: 99 }],
		['bytes=100-', 1000, { start: 100, end: 999 }],
		['bytes=-100', 1000, { start: 900, end: 999 }],
		['bytes=0-5000', 1000, { start: 0, end: 999 }],
		['bytes=999-999', 1000, { start: 999, end: 999 }]
	])('%s of %i', (header, size, expected) => expect(parseRange(header, size)).toEqual(expected));

	it.each([null, '', 'items=0-1', 'bytes=abc', 'bytes=5-2', 'bytes=1000-', 'bytes=-0', 'bytes=0-1,5-6'])(
		'ignores or rejects %j',
		(header) => expect(parseRange(header as string | null, 1000)).toBeNull()
	);
});
