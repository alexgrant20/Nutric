// Motion helpers for the 3D scenes. Every one of them is a no-op when the visitor asks for reduced
// motion, so the CSS fallbacks (variables left unset) give a static, fully readable page.

export const prefersReducedMotion = () =>
	typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/**
 * Pointer depth: sets --rx/--ry (degrees) and --px/--py (-1..1) on the node while the pointer
 * is over it. Children turn them into rotation and parallax. Mouse and pen only.
 */
export function tilt(node: HTMLElement, opts: { max?: number } = {}) {
	if (prefersReducedMotion() || !hasFinePointer()) return;
	const max = opts.max ?? 8;
	let raf = 0;
	const set = (rx: number, ry: number, px: number, py: number) => {
		node.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
		node.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
		node.style.setProperty('--px', px.toFixed(3));
		node.style.setProperty('--py', py.toFixed(3));
	};
	const move = (e: PointerEvent) => {
		const r = node.getBoundingClientRect();
		const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
		const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(() => set(-y * max, x * max, x, y));
	};
	const leave = () => {
		cancelAnimationFrame(raf);
		set(0, 0, 0, 0);
	};
	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', leave);
	return {
		destroy() {
			cancelAnimationFrame(raf);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', leave);
		}
	};
}

/**
 * Scroll depth: sets --p (0..1) on the node.
 * "leave": 0 while the node's top is at the viewport top, 1 once its bottom has left (hero parallax).
 * "cross": 0 as the node enters from below, 1 as it exits at the top (scroll-linked reveals).
 * "sticky": 0 when the node starts to scroll, 1 when its sticky content is about to release (pinned scenes).
 */
export function scrollProgress(node: HTMLElement, opts: { mode?: 'leave' | 'cross' | 'sticky' } = {}) {
	if (prefersReducedMotion()) return;
	const mode = opts.mode ?? 'cross';
	let raf = 0;
	const update = () => {
		raf = 0;
		const r = node.getBoundingClientRect();
		const vh = window.innerHeight;
		const p =
			mode === 'leave'
				? clamp(-r.top / Math.max(1, r.height))
				: mode === 'sticky'
					? clamp(-r.top / Math.max(1, r.height - vh))
					: clamp((vh - r.top) / (vh + r.height));
		node.style.setProperty('--p', p.toFixed(4));
	};
	const schedule = () => {
		if (!raf) raf = requestAnimationFrame(update);
	};
	update();
	addEventListener('scroll', schedule, { passive: true });
	addEventListener('resize', schedule);
	return {
		destroy() {
			cancelAnimationFrame(raf);
			removeEventListener('scroll', schedule);
			removeEventListener('resize', schedule);
		}
	};
}
