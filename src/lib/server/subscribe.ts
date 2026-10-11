import type { Db } from './db';
import * as s from './db/schema';
import { isLang } from '../i18n/config';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: string): string | null {
	const e = raw.trim().toLowerCase();
	return e.length <= 254 && EMAIL.test(e) ? e : null;
}

export function subscribe(db: Db, rawEmail: string, lang: string): 'ok' | 'invalid' | 'duplicate' {
	const email = normalizeEmail(rawEmail);
	if (!email) return 'invalid';
	const res = db.insert(s.subscribers).values({ email, lang: isLang(lang) ? lang : 'en' }).onConflictDoNothing().run();
	return res.changes === 0 ? 'duplicate' : 'ok';
}
