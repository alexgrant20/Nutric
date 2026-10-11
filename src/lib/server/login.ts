import { eq } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';
import { verifyPassword } from './auth';
import type { RateLimiter } from './rate-limit';

// A valid argon2 hash of a throwaway string so unknown emails cost the same time as known ones.
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$q5rdmovKoo2WSx+DJxg38w$JkjmZt/bxHa8ZnElTZtDvZhgeGawEdrb3EqnCebkOeQ';

export type LoginResult = { ok: true; userId: number } | { ok: false; reason: 'blocked' | 'invalid' };

/**
 * The attempt is counted before any await, so parallel guesses from one address all see the
 * updated count. A correct password clears the count again.
 */
export async function tryLogin(db: Db, limiter: RateLimiter, key: string, email: string, password: string): Promise<LoginResult> {
	if (limiter.isBlocked(key)) return { ok: false, reason: 'blocked' };
	limiter.fail(key);
	const user = db.select().from(s.adminUsers).where(eq(s.adminUsers.email, email.trim().toLowerCase())).get();
	const ok = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, password);
	if (!user || !ok) return { ok: false, reason: 'invalid' };
	limiter.reset(key);
	return { ok: true, userId: user.id };
}
