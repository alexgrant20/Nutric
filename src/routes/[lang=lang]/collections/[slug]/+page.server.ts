import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { getCollectionBySlug, getProducts } from '$lib/server/content';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const lang = params.lang as Lang;
	const collection = getCollectionBySlug(db, lang, params.slug);
	if (!collection) throw error(404);
	return { collection, products: getProducts(db, lang, { collectionId: collection.id }) };
};
