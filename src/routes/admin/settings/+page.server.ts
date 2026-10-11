import { fail } from '@sveltejs/kit';
import { UPLOAD_DIR } from '$app/env/private';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { readSettingsForm, socialLinksToText, validateSettings } from '$lib/server/settings-form';
import { saveUpload, UploadError } from '$lib/server/upload';
import { DEFAULT_THEME } from '$lib/theme/tokens';
import { LANGUAGES, enabledLangs } from '$lib/i18n/config';

export const load = () => {
	const base = db.select().from(s.siteSettings).where(eq(s.siteSettings.id, 1)).get();
	const trs = Object.fromEntries(db.select().from(s.siteSettingsTranslations).all().map((r) => [r.lang, r]));
	return {
		base: base ? { ...base, socialLinks: socialLinksToText(base.socialLinks) } : null,
		trs, theme: base?.theme ?? DEFAULT_THEME, languages: LANGUAGES.filter((l) => l.enabled)
	};
};

export const actions = {
	save: async ({ request }) => {
		const fd = await request.formData();
		const parsed = readSettingsForm(fd);
		const { errors, theme } = validateSettings(parsed);
		for (const field of ['logoImage', 'heroMedia', 'heroProductImage'] as const) {
			const file = fd.get(`file.${field}`);
			if (file instanceof File && file.size > 0) {
				try { parsed.base[field] = await saveUpload(file, 'settings', UPLOAD_DIR); }
				catch (e) { errors[`f.${field}`] = e instanceof UploadError ? e.message : 'The upload failed.'; }
			}
		}
		if (Object.keys(errors).length) return fail(400, { errors });
		db.transaction((tx) => {
			tx.insert(s.siteSettings).values({ id: 1, ...parsed.base, brandName: parsed.base.brandName!, theme })
				.onConflictDoUpdate({ target: s.siteSettings.id, set: { ...parsed.base, brandName: parsed.base.brandName!, theme, updatedAt: Math.floor(Date.now() / 1000) } }).run();
			for (const lang of enabledLangs()) {
				const tr = parsed.trs[lang];
				tx.delete(s.siteSettingsTranslations).where(eq(s.siteSettingsTranslations.lang, lang)).run();
				if (Object.values(tr).some((v) => v != null)) tx.insert(s.siteSettingsTranslations).values({ lang, ...tr }).run();
			}
		});
		return { saved: true };
	}
};
