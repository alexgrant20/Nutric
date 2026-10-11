import { expect, it } from 'vitest';
import { RateLimiter } from './rate-limit';

it('blocks after max failures within the window and recovers after it', () => {
	const rl = new RateLimiter(5, 900_000);
	for (let i = 0; i < 5; i++) {
		expect(rl.isBlocked('ip', i)).toBe(false);
		rl.fail('ip', i);
	}
	expect(rl.isBlocked('ip', 10)).toBe(true);
	expect(rl.isBlocked('other', 10)).toBe(false);
	expect(rl.isBlocked('ip', 900_100)).toBe(false);
});
it('reset clears failures', () => {
	const rl = new RateLimiter(2, 1000);
	rl.fail('ip', 0);
	rl.fail('ip', 1);
	rl.reset('ip');
	expect(rl.isBlocked('ip', 2)).toBe(false);
});
