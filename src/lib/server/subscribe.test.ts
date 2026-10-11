import { describe, expect, it } from 'vitest';
import { createDb } from './db';
import * as s from './db/schema';
import { normalizeEmail, subscribe } from './subscribe';

describe('normalizeEmail', () => {
	it.each([
		['  User@Example.COM ', 'user@example.com'],
		['a@b.co', 'a@b.co']
	])('%s -> %s', (raw, expected) => expect(normalizeEmail(raw)).toBe(expected));
	it.each(['', 'nope', 'a@b', '@b.co', 'a b@c.co', 'a@b.c', `${'x'.repeat(250)}@b.co`, 'a@b.co\nBcc: x@y.co'])(
		'rejects %j',
		(raw) => expect(normalizeEmail(raw)).toBeNull()
	);
});

describe('subscribe', () => {
	it('stores a valid address once, case-insensitively', () => {
		const db = createDb(':memory:');
		expect(subscribe(db, 'A@B.co', 'en')).toBe('ok');
		expect(subscribe(db, ' a@b.CO', 'zh')).toBe('duplicate');
		expect(db.select().from(s.subscribers).all()).toHaveLength(1);
	});
	it('rejects invalid input without writing', () => {
		const db = createDb(':memory:');
		expect(subscribe(db, 'bad', 'en')).toBe('invalid');
		expect(db.select().from(s.subscribers).all()).toHaveLength(0);
	});
	it('falls back to en for an unknown language', () => {
		const db = createDb(':memory:');
		subscribe(db, 'a@b.co', 'xx');
		expect(db.select().from(s.subscribers).get()?.lang).toBe('en');
	});
});
