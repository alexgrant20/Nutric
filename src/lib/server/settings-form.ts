import { enabledLangs, type Lang } from '../i18n/config';
import { COLOR_KEYS, validateTheme, type Theme } from '../theme/tokens';

export function parseSocialLinks(text: string): { platform: string; url: string }[] {
	return text.split(/\r?\n/).map((line) => line.split('|').map((x) => x.trim()))
		.filter(([platform, url]) => platform && url && /^https:\/\//.test(url))
		.map(([platform, url]) => ({ platform: platform.toLowerCase(), url }))
		.filter((link, i, all) => all.findIndex((x) => x.url === link.url) === i);
}
export const socialLinksToText = (list: { platform: string; url: string }[]) => list.map((l) => `${l.platform}|${l.url}`).join('\n');

const t = (fd: FormData, k: string) => {
	const v = String(fd.get(k) ?? '').trim();
	return v === '' ? null : v;
};
const TR_FIELDS = ['tagline', 'headlineLine1', 'headlineLine2', 'subheadline', 'ctaLabel', 'heroBadgeText', 'aboutTeaserMd', 'aboutMd', 'termsMd', 'aboutImageAlt', 'footerNote'] as const;
export type SettingsTr = Record<(typeof TR_FIELDS)[number], string | null>;

export function readSettingsForm(fd: FormData) {
	const base = {
		brandName: t(fd, 'f.brandName'),
		contactEmail: t(fd, 'f.contactEmail'),
		contactPhone: t(fd, 'f.contactPhone'),
		whatsappUrl: t(fd, 'f.whatsappUrl'),
		heroMediaType: t(fd, 'f.heroMediaType') === 'video' ? ('video' as const) : ('image' as const),
		socialLinks: parseSocialLinks(String(fd.get('f.socialLinks') ?? '')),
		logoImage: t(fd, 'f.logoImage'),
		heroMedia: t(fd, 'f.heroMedia'),
		heroProductImage: t(fd, 'f.heroProductImage')
	};
	const trs = {} as Record<Lang, SettingsTr>;
	for (const lang of enabledLangs()) {
		trs[lang] = Object.fromEntries(TR_FIELDS.map((f) => [f, t(fd, `t.${lang}.${f}`)])) as SettingsTr;
	}
	const themeInput = {
		colors: Object.fromEntries(COLOR_KEYS.map((k) => [k, String(fd.get(`theme.${k}`) ?? '')])),
		fonts: { sans: String(fd.get('theme.fontSans') ?? ''), serif: String(fd.get('theme.fontSerif') ?? '') },
		radius: { sm: Number(fd.get('theme.radiusSm')), md: Number(fd.get('theme.radiusMd')) }
	};
	return { base, trs, themeInput };
}

export function validateSettings(p: ReturnType<typeof readSettingsForm>): { errors: Record<string, string>; theme: Theme | null } {
	const errors: Record<string, string> = {};
	if (!p.base.brandName) errors['f.brandName'] = 'Brand name is required.';
	if (p.base.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.base.contactEmail)) errors['f.contactEmail'] = 'Enter a valid email address.';
	if (p.base.whatsappUrl && !/^https:\/\//.test(p.base.whatsappUrl)) errors['f.whatsappUrl'] = 'The link must start with https://';
	const checked = validateTheme(p.themeInput);
	if (!checked.ok) {
		errors.theme = checked.errors.join(' ');
		return { errors, theme: null };
	}
	return { errors, theme: checked.theme };
}
