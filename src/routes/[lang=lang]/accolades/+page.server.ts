import { db } from '$lib/server/db/instance';
import { getAccolades } from '$lib/server/content';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => ({ items: getAccolades(db, params.lang as Lang) });
