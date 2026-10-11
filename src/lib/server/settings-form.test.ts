import { describe, expect, it } from 'vitest';
import { parseSocialLinks, readSettingsForm, socialLinksToText, validateSettings } from './settings-form';
import { DEFAULT_THEME } from '../theme/tokens';

describe('social links', () => {
	it('parses platform|url lines and keeps only https URLs', () => {
		expect(parseSocialLinks('facebook|https://fb.com/x\nbad|javascript:alert(1)\ninstagram | https://ig.com/y\n\nnourl')).toEqual([
			{ platform: 'facebook', url: 'https://fb.com/x' },
			{ platform: 'instagram', url: 'https://ig.com/y' }
		]);
	});
	it('round-trips', () => {
		const list = [{ platform: 'youtube', url: 'https://youtube.com/c/x' }];
		expect(parseSocialLinks(socialLinksToText(list))).toEqual(list);
	});
});

function fd(entries: [string, string][]) {
	const f = new FormData();
	for (const [k, v] of entries) f.append(k, v);
	return f;
}
const colorEntries = Object.entries(DEFAULT_THEME.colors).map(([k, v]) => [`theme.${k}`, v] as [string, string]);

describe('validateSettings', () => {
	const ok: [string, string][] = [['f.brandName', 'Nutric'], ['theme.radiusSm', '4'], ['theme.radiusMd', '12'], ['theme.fontSans', 'Poppins'], ['theme.fontSerif', 'Fraunces'], ...colorEntries];
	it('accepts valid settings', () => {
		const r = validateSettings(readSettingsForm(fd(ok)));
		expect(r.errors).toEqual({});
		expect(r.theme).not.toBeNull();
	});
	it('requires a brand name', () => {
		const r = validateSettings(readSettingsForm(fd(ok.map(([k, v]) => (k === 'f.brandName' ? [k, ''] : [k, v])) as [string, string][])));
		expect(r.errors['f.brandName']).toBeTruthy();
	});
	it('names the failing contrast pair', () => {
		const bad = ok.map(([k, v]) => (k === 'theme.stone600' ? [k, '#e0ddd0'] : [k, v])) as [string, string][];
		const r = validateSettings(readSettingsForm(fd(bad)));
		expect(r.errors.theme).toContain('stone600');
		expect(r.theme).toBeNull();
	});
	it('rejects a non-https WhatsApp link and a malformed email', () => {
		const r = validateSettings(readSettingsForm(fd([...ok, ['f.whatsappUrl', 'http://wa.me/1'], ['f.contactEmail', 'nope']])));
		expect(r.errors['f.whatsappUrl']).toBeTruthy();
		expect(r.errors['f.contactEmail']).toBeTruthy();
	});
});
