import { htmlLangFor, type Lang } from './i18n/config';

export function formatDate(iso: string | null, lang: Lang): string {
	if (!iso) return '';
	const d = new Date(`${iso}T00:00:00Z`);
	if (Number.isNaN(d.getTime())) return '';
	return new Intl.DateTimeFormat(htmlLangFor(lang), { dateStyle: 'long', timeZone: 'UTC' }).format(d);
}
