import { eq, ne } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';
import { hashPassword, verifyPassword } from './auth';
import { SECTION_KEYS } from './sections';

export function csvEscape(cell: string): string {
	let v = cell;
	const formula = /^[=+\-@\t\r]/.test(v);
	if (formula) v = `'${v}`;
	return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function reorderSections(db: Db, orderedKeys: string[], enabled: Set<string>): void {
	const valid = orderedKeys.filter((k) => (SECTION_KEYS as readonly string[]).includes(k));
	const rest = SECTION_KEYS.filter((k) => !valid.includes(k));
	[...valid, ...rest].forEach((key, position) => {
		db.update(s.pageSections).set({ position, isEnabled: enabled.has(key) }).where(eq(s.pageSections.key, key)).run();
	});
}

export async function changePassword(db: Db, userId: number, current: string, next: string): Promise<'ok' | 'wrong-current' | 'too-short'> {
	const user = db.select().from(s.adminUsers).where(eq(s.adminUsers.id, userId)).get();
	if (!user || !(await verifyPassword(user.passwordHash, current))) return 'wrong-current';
	if (next.length < 12) return 'too-short';
	db.update(s.adminUsers).set({ passwordHash: await hashPassword(next) }).where(eq(s.adminUsers.id, userId)).run();
	return 'ok';
}
