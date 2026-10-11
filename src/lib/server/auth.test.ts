import { describe, expect, it } from 'vitest';
import { createDb } from './db';
import { createAdminUser, createSession, deleteSession, hashPassword, validateSession, verifyPassword } from './auth';

describe('passwords', () => {
	it('hashes and verifies', async () => {
		const h = await hashPassword('correct horse battery');
		expect(h).not.toContain('correct horse');
		expect(await verifyPassword(h, 'correct horse battery')).toBe(true);
		expect(await verifyPassword(h, 'wrong')).toBe(false);
	});
});

describe('sessions', () => {
	async function setup() {
		const db = createDb(':memory:');
		await createAdminUser(db, 'a@b.co', 'password-123456');
		return db;
	}
	it('creates and validates a session', async () => {
		const db = await setup();
		const { token } = createSession(db, 1, 1_000_000);
		expect(validateSession(db, token, 1_000_001)?.email).toBe('a@b.co');
	});
	it('stores only a hash of the token', async () => {
		const db = await setup();
		const { token } = createSession(db, 1);
		const rows = db.$client.prepare('select id from sessions').all() as { id: string }[];
		expect(rows[0].id).not.toBe(token);
	});
	it('expires after 7 days', async () => {
		const db = await setup();
		const { token } = createSession(db, 1, 0);
		expect(validateSession(db, token, 7 * 86_400_000 + 1)).toBeNull();
	});
	it('slides the expiry when more than half the time has passed', async () => {
		const db = await setup();
		const { token } = createSession(db, 1, 0);
		expect(validateSession(db, token, 5 * 86_400_000)).not.toBeNull();
		expect(validateSession(db, token, 11 * 86_400_000)).not.toBeNull();
	});
	it('rejects unknown tokens and deleted sessions', async () => {
		const db = await setup();
		expect(validateSession(db, 'nope')).toBeNull();
		const { token } = createSession(db, 1);
		deleteSession(db, token);
		expect(validateSession(db, token)).toBeNull();
	});
});
