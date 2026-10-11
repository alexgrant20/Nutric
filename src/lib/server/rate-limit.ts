export class RateLimiter {
	private hits = new Map<string, number[]>();
	constructor(private max: number, private windowMs: number) {}
	private recent(key: string, now: number): number[] {
		const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
		this.hits.set(key, list);
		return list;
	}
	isBlocked(key: string, now = Date.now()): boolean {
		return this.recent(key, now).length >= this.max;
	}
	fail(key: string, now = Date.now()): void {
		this.recent(key, now).push(now);
	}
	reset(key: string): void {
		this.hits.delete(key);
	}
}
