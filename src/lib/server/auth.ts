import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';

const DAY_MS = 86_400_000;
export const SESSION_DAYS = 7;
const sha = (token: string) => createHash('sha256').update(token).digest('hex');

export const hashPassword = (pw: string) => hash(pw);
export const verifyPassword = (h: string, pw: string) => verify(h, pw).catch(() => false);

export async function createAdminUser(db: Db, email: string, password: string): Promise<void> {
	const passwordHash = await hashPassword(password);
	db.insert(s.adminUsers).values({ email: email.toLowerCase(), passwordHash })
		.onConflictDoUpdate({ target: s.adminUsers.email, set: { passwordHash } }).run();
}

export function createSession(db: Db, userId: number, nowMs = Date.now()) {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = nowMs + SESSION_DAYS * DAY_MS;
	db.insert(s.sessions).values({ id: sha(token), userId, expiresAt }).run();
	return { token, expiresAt };
}

export function validateSession(db: Db, token: string, nowMs = Date.now()) {
	const id = sha(token);
	const row = db.select({ session: s.sessions, user: s.adminUsers }).from(s.sessions)
		.innerJoin(s.adminUsers, eq(s.sessions.userId, s.adminUsers.id))
		.where(eq(s.sessions.id, id)).get();
	if (!row) return null;
	if (row.session.expiresAt <= nowMs) {
		db.delete(s.sessions).where(eq(s.sessions.id, id)).run();
		return null;
	}
	if (row.session.expiresAt - nowMs < (SESSION_DAYS * DAY_MS) / 2) {
		db.update(s.sessions).set({ expiresAt: nowMs + SESSION_DAYS * DAY_MS }).where(eq(s.sessions.id, id)).run();
	}
	return { id: row.user.id, email: row.user.email };
}

export function deleteSession(db: Db, token: string): void {
	db.delete(s.sessions).where(eq(s.sessions.id, sha(token))).run();
}
