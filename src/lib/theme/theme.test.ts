import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { CONTRAST_PAIRS, DEFAULT_THEME, themeToCss, validateTheme } from './tokens';

describe('contrastRatio', () => {
	it('is 21 for black on white and 1 for identical colors', () => {
		expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
		expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
	});
});

describe('default theme', () => {
	it('meets every listed contrast pair', () => {
		for (const p of CONTRAST_PAIRS) {
			const r = contrastRatio(DEFAULT_THEME.colors[p.fg], DEFAULT_THEME.colors[p.bg]);
			expect(r, `${p.fg} on ${p.bg} (${p.use})`).toBeGreaterThanOrEqual(p.min);
		}
	});
	it('validates', () => {
		expect(validateTheme(DEFAULT_THEME).ok).toBe(true);
	});
});

describe('validateTheme', () => {
	it('names the failing pair when contrast is too low', () => {
		const bad = structuredClone(DEFAULT_THEME);
		bad.colors.stone600 = '#d8d4c8';
		const r = validateTheme(bad);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.errors.join(' ')).toContain('stone600');
	});
	it('rejects non-hex colors, unknown fonts and out-of-range radius', () => {
		const bad = structuredClone(DEFAULT_THEME) as any;
		bad.colors.lime400 = 'red; background:url(x)';
		bad.fonts.sans = 'Comic Sans';
		bad.radius.md = 400;
		const r = validateTheme(bad);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.errors.length).toBeGreaterThanOrEqual(3);
	});
	it('rejects non-objects', () => {
		expect(validateTheme(null).ok).toBe(false);
	});
});

describe('themeToCss', () => {
	it('emits CSS variables', () => {
		const css = themeToCss(DEFAULT_THEME);
		expect(css).toContain('--forest-900:#12241A');
		expect(css).toContain('--r-sm:4px');
		expect(css).toContain("--font-latin-sans:'Poppins'");
	});
});
