import { z } from 'zod';
import { contrastRatio } from './contrast';

export const COLOR_KEYS = ['forest900', 'forest700', 'cream100', 'ink900', 'stone600', 'lime400'] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
export const FONT_FAMILIES = ['Poppins', 'Fraunces'] as const;

export type Theme = {
	colors: Record<ColorKey, string>;
	fonts: { sans: (typeof FONT_FAMILIES)[number]; serif: (typeof FONT_FAMILIES)[number] };
	radius: { sm: number; md: number };
};

export const DEFAULT_THEME: Theme = {
	colors: {
		forest900: '#12241A',
		forest700: '#1F3B2A',
		cream100: '#F4F1E8',
		ink900: '#1B1F1C',
		stone600: '#5A6159',
		lime400: '#C8F07A'
	},
	fonts: { sans: 'Poppins', serif: 'Fraunces' },
	radius: { sm: 4, md: 12 }
};

/** Every foreground/background pair the UI uses, with its required ratio. */
export const CONTRAST_PAIRS: { fg: ColorKey; bg: ColorKey; min: number; use: string }[] = [
	{ fg: 'ink900', bg: 'cream100', min: 4.5, use: 'body text on page' },
	{ fg: 'stone600', bg: 'cream100', min: 4.5, use: 'secondary text on page' },
	{ fg: 'forest700', bg: 'cream100', min: 4.5, use: 'headings on page' },
	{ fg: 'cream100', bg: 'forest700', min: 4.5, use: 'text on forest surface' },
	{ fg: 'cream100', bg: 'forest900', min: 4.5, use: 'text on deep surface and scrim' },
	{ fg: 'forest900', bg: 'lime400', min: 4.5, use: 'primary CTA label' },
	{ fg: 'lime400', bg: 'forest900', min: 3, use: 'focus ring and marker on deep surface' },
	{ fg: 'lime400', bg: 'forest700', min: 3, use: 'focus ring and marker on forest surface' }
];

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a 6-digit hex color like #12241A');
const schema = z.object({
	colors: z.object(Object.fromEntries(COLOR_KEYS.map((k) => [k, hex])) as Record<ColorKey, typeof hex>),
	fonts: z.object({ sans: z.enum(FONT_FAMILIES), serif: z.enum(FONT_FAMILIES) }),
	radius: z.object({ sm: z.number().int().min(0).max(16), md: z.number().int().min(0).max(32) })
});

export function validateTheme(input: unknown): { ok: true; theme: Theme } | { ok: false; errors: string[] } {
	const parsed = schema.safeParse(input);
	if (!parsed.success) {
		return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
	}
	const theme = parsed.data as Theme;
	const errors: string[] = [];
	for (const p of CONTRAST_PAIRS) {
		const r = contrastRatio(theme.colors[p.fg], theme.colors[p.bg]);
		if (r < p.min) {
			errors.push(`${p.fg} on ${p.bg} (${p.use}) has contrast ${r.toFixed(2)}, needs ${p.min}`);
		}
	}
	return errors.length ? { ok: false, errors } : { ok: true, theme };
}

const CSS_NAME: Record<ColorKey, string> = {
	forest900: '--forest-900',
	forest700: '--forest-700',
	cream100: '--cream-100',
	ink900: '--ink-900',
	stone600: '--stone-600',
	lime400: '--lime-400'
};

export function themeToCss(theme: Theme): string {
	const colors = COLOR_KEYS.map((k) => `${CSS_NAME[k]}:${theme.colors[k]}`).join(';');
	return `:root{${colors};--r-sm:${theme.radius.sm}px;--r-md:${theme.radius.md}px;--font-latin-sans:'${theme.fonts.sans}';--font-latin-serif:'${theme.fonts.serif}'}`;
}
