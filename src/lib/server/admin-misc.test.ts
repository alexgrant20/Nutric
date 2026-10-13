import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createDb } from './db';
import * as s from './db/schema';
import { createAdminUser, verifyPassword } from './auth';
import { changePassword, csvEscape, reorderSections } from './admin-misc';
import { ensureSections } from './sections';

describe('csvEscape', () => {
	it.each([
		['plain', 'plain'],
		['a,b', '"a,b"'],
		['say "hi"', '"say ""hi"""'],
		['=HYPERLINK("x")', `"'=HYPERLINK(""x"")"`],
		['+1', `'+1`],
		['-1', `'-1`],
		['@cmd', `'@cmd`]
	])('%s', (input, expected) => expect(csvEscape(input)).toBe(expected));
});

describe('reorderSections', () => {
	it('sets positions and enabled flags from the submitted order', () => {
		const db = createDb(':memory:');
		ensureSections(db);
		reorderSections(db, ['news', 'hero', 'newsletter', 'about', 'collections', 'best_seller', 'testimonials', 'accolades'], new Set(['news', 'hero', 'newsletter']));
		const rows = db.select().from(s.pageSections).all();
		expect(rows.find((r) => r.key === 'news')?.position).toBe(0);
		expect(rows.find((r) => r.key === 'about')?.isEnabled).toBe(false);
		expect(rows.find((r) => r.key === 'hero')?.isEnabled).toBe(true);
	});
	it('ignores unknown keys and keeps every section', () => {
		const db = createDb(':memory:');
		ensureSections(db);
		reorderSections(db, ['bogus', 'news'], new Set(['news']));
		expect(db.select().from(s.pageSections).all()).toHaveLength(9);
	});
});

describe('ensureSections', () => {
	it('slots a section added later at its default place, keeping the rest in order', () => {
		const db = createDb(':memory:');
		ensureSections(db);
		db.delete(s.pageSections).where(eq(s.pageSections.key, 'reviews')).run();
		db.update(s.pageSections).set({ position: 7 }).where(eq(s.pageSections.key, 'newsletter')).run();
		ensureSections(db);
		const order = db.select().from(s.pageSections).orderBy(s.pageSections.position).all().map((r) => r.key);
		expect(order.slice(-4)).toEqual(['news', 'reviews', 'newsletter', 'about']);
	});
});

describe('changePassword', () => {
	it('changes the password when the current one matches and the new one is long enough', async () => {
		const db = createDb(':memory:');
		await createAdminUser(db, 'a@b.co', 'old-password-123');
		expect(await changePassword(db, 1, 'old-password-123', 'new-password-456')).toBe('ok');
		const u = db.select().from(s.adminUsers).get()!;
		expect(await verifyPassword(u.passwordHash, 'new-password-456')).toBe(true);
	});
	it('rejects a wrong current password and a short new password', async () => {
		const db = createDb(':memory:');
		await createAdminUser(db, 'a@b.co', 'old-password-123');
		expect(await changePassword(db, 1, 'nope', 'new-password-456')).toBe('wrong-current');
		expect(await changePassword(db, 1, 'old-password-123', 'short')).toBe('too-short');
	});
});
