import { describe, expect, it } from 'vitest';
import { createDb } from './db';
import { createAdminUser } from './auth';
import { RateLimiter } from './rate-limit';
import { tryLogin } from './login';

async function setup() {
	const db = createDb(':memory:');
	await createAdminUser(db, 'a@b.co', 'right-password-123');
	return db;
}

describe('tryLogin', () => {
	it('accepts the right password and clears the failures', async () => {
		const db = await setup();
		const limiter = new RateLimiter(5, 60_000);
		const r = await tryLogin(db, limiter, 'ip', 'A@B.co', 'right-password-123');
		expect(r).toEqual({ ok: true, userId: 1 });
		expect(limiter.isBlocked('ip')).toBe(false);
	});

	it('rejects a wrong password and an unknown email the same way', async () => {
		const db = await setup();
		const limiter = new RateLimiter(5, 60_000);
		expect(await tryLogin(db, limiter, 'ip', 'a@b.co', 'nope')).toEqual({ ok: false, reason: 'invalid' });
		expect(await tryLogin(db, limiter, 'ip', 'x@y.co', 'nope')).toEqual({ ok: false, reason: 'invalid' });
	});

	it('limits parallel guesses: only max attempts are verified, the rest are blocked', async () => {
		const db = await setup();
		const limiter = new RateLimiter(5, 60_000);
		const results = await Promise.all(
			Array.from({ length: 30 }, (_, i) => tryLogin(db, limiter, 'ip', 'a@b.co', `guess-${i}`))
		);
		const invalid = results.filter((r) => !r.ok && r.reason === 'invalid').length;
		const blocked = results.filter((r) => !r.ok && r.reason === 'blocked').length;
		expect(invalid).toBe(5);
		expect(blocked).toBe(25);
	});

	it('a correct password cannot get through once blocked', async () => {
		const db = await setup();
		const limiter = new RateLimiter(2, 60_000);
		await tryLogin(db, limiter, 'ip', 'a@b.co', 'x');
		await tryLogin(db, limiter, 'ip', 'a@b.co', 'y');
		expect(await tryLogin(db, limiter, 'ip', 'a@b.co', 'right-password-123')).toEqual({ ok: false, reason: 'blocked' });
	});
});
