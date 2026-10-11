/** Parses a single-range `Range: bytes=...` header. Returns null when absent, malformed, multi-range or unsatisfiable. */
export function parseRange(header: string | null, size: number): { start: number; end: number } | null {
	if (!header) return null;
	const m = header.match(/^bytes=(\d*)-(\d*)$/);
	if (!m || (m[1] === '' && m[2] === '')) return null;
	let start: number;
	let end: number;
	if (m[1] === '') {
		const suffix = Number(m[2]);
		if (suffix === 0) return null;
		start = Math.max(0, size - suffix);
		end = size - 1;
	} else {
		start = Number(m[1]);
		end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
	}
	if (start >= size || start > end) return null;
	return { start, end };
}
