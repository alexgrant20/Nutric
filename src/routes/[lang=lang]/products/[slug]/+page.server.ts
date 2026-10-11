import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { getCollections, getProductBySlug, getProducts } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const lang = params.lang as Lang;
	const product = getProductBySlug(db, lang, params.slug);
	if (!product) throw error(404);
	const collection = getCollections(db, lang).find((c) => c.id === product.collectionId) ?? null;
	return {
		product,
		collection,
		html: {
			description: renderMarkdown(product.t.descriptionMd),
			ingredients: renderMarkdown(product.t.ingredientsMd),
			howToUse: renderMarkdown(product.t.howToUseMd)
		},
		related: product.collectionId ? getProducts(db, lang, { collectionId: product.collectionId, excludeId: product.id, limit: 4 }) : []
	};
};
