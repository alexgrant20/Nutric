import { db } from '$lib/server/db/instance';
import { getNewsPage } from '$lib/server/content';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params, url }) => ({
	...getNewsPage(db, params.lang as Lang, Number(url.searchParams.get('page')) || 1, 9)
});
