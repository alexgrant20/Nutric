import { json } from '@sveltejs/kit';
import { DEEPL_API_KEY } from '$app/env/private';
import { isLang } from '$lib/i18n/config';
import { translateFields, UnsupportedLanguageError } from '$lib/server/translation';

const active = new Set<number>();
export const POST = async ({ request, locals, url }) => {
	if (!locals.user) return json({ error: 'Sign in to translate content.' }, { status: 401 });
	if (request.headers.get('origin') && request.headers.get('origin') !== url.origin) return json({ error: 'Invalid origin.' }, { status: 403 });
	if (active.has(locals.user.id)) return json({ error: 'A translation is already running. Please wait.' }, { status: 429 });
	const body = await request.text();
	if (body.length > 60_000) return json({ error: 'Content is too long. Maximum: 60,000 characters.' }, { status: 413 });
	let input;
	try { input = JSON.parse(body); } catch { return json({ error: 'Invalid request.' }, { status: 400 }); }
	if (!input || !['en', 'id'].includes(input.source) || !isLang(input.target) || input.source === input.target || !input.fields || typeof input.fields !== 'object' || Array.isArray(input.fields) || Object.keys(input.fields).length > 30 || Object.values(input.fields).some((v) => typeof v !== 'string')) {
		return json({ error: 'Select Indonesia or English as the source and a different target language.' }, { status: 400 });
	}
	active.add(locals.user.id);
	try {
		const fields = await translateFields(input.fields, input.source, input.target, { key: DEEPL_API_KEY });
		return json({ fields });
	} catch (e) {
		if (e instanceof UnsupportedLanguageError) return json({ error: e.message, unsupported: true }, { status: 422 });
		const message = e instanceof TypeError ? 'Cannot reach DeepL. Check the internet access of the server.' : e instanceof Error ? e.message : 'Translation failed.';
		// Not 5xx: the cPanel proxy replaces 5xx bodies with its own Bad Gateway page.
		return json({ error: message }, { status: 422 });
	} finally { active.delete(locals.user.id); }
};
