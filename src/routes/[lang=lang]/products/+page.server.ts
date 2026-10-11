import { db } from '$lib/server/db/instance';
import { getCollections, getProducts } from '$lib/server/content';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const lang = params.lang as Lang;
	const products = getProducts(db, lang);
	const collections = getCollections(db, lang);
	const groups = collections.map((c) => ({ collection: c, products: products.filter((p) => p.collectionId === c.id) }));
	const loose = products.filter((p) => !collections.some((c) => c.id === p.collectionId));
	return { groups, loose };
};
