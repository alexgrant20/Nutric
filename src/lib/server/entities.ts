import * as s from './db/schema';

export type EntityKey = 'products' | 'collections' | 'news' | 'testimonials' | 'accolades';
export type FieldType =
	| 'text' | 'textarea' | 'markdown' | 'image' | 'imageList' | 'boolean' | 'number'
	| 'date' | 'select' | 'relation' | 'lines' | 'faqs' | 'url';

export interface Field {
	name: string;
	label: string;
	type: FieldType;
	translatable?: boolean;
	required?: boolean;
	options?: { value: string; label: string }[];
	relation?: 'collections';
	help?: string;
}
export interface Entity {
	key: EntityKey;
	label: string;
	singular: string;
	table: any;
	trTable: any;
	fk: string;
	fields: Field[];
	titleField: string;
	imageField: string | null;
	publish: { name: string; on: unknown; off: unknown } | null;
	slugFrom: string | null;
	order: 'sort' | 'date';
}

const sortOrder: Field = { name: 'sortOrder', label: 'Sort order', type: 'number', help: 'Lower numbers appear first.' };
const published: Field = { name: 'isPublished', label: 'Published', type: 'boolean' };
const publishFlag = { name: 'isPublished', on: true, off: false };

export const ENTITIES: Record<EntityKey, Entity> = {
	products: {
		key: 'products', label: 'Products', singular: 'product', table: s.products, trTable: s.productTranslations, fk: 'productId',
		titleField: 'name', imageField: 'mainImage', publish: publishFlag, slugFrom: 'name', order: 'sort',
		fields: [
			{ name: 'collectionId', label: 'Collection', type: 'relation', relation: 'collections' },
			{ name: 'mainImage', label: 'Main image', type: 'image' },
			{ name: 'gallery', label: 'Extra images', type: 'imageList' },
			{ name: 'isBestSeller', label: 'Best seller', type: 'boolean', help: 'The first published best seller (lowest sort order) is the landing spotlight.' },
			published, sortOrder,
			{ name: 'name', label: 'Name', type: 'text', translatable: true, required: true },
			{ name: 'shortDescription', label: 'Short description', type: 'textarea', translatable: true },
			{ name: 'descriptionMd', label: 'Description', type: 'markdown', translatable: true },
			{ name: 'benefits', label: 'Benefits (one per line)', type: 'lines', translatable: true },
			{ name: 'ingredientsMd', label: 'Ingredients', type: 'markdown', translatable: true },
			{ name: 'howToUseMd', label: 'How to use', type: 'markdown', translatable: true },
			{ name: 'faqs', label: 'FAQs', type: 'faqs', translatable: true, help: 'Question on the first line, answer below it. Leave a blank line between FAQs.' },
			{ name: 'regulatoryText', label: 'Regulatory text', type: 'textarea', translatable: true, help: 'Registration and advertisement approval text, shown as written.' },
			{ name: 'imageAlt', label: 'Image description', type: 'text', translatable: true }
		]
	},
	collections: {
		key: 'collections', label: 'Collections', singular: 'collection', table: s.collections, trTable: s.collectionTranslations, fk: 'collectionId',
		titleField: 'name', imageField: 'bannerImage', publish: null, slugFrom: 'name', order: 'sort',
		fields: [
			{ name: 'bannerImage', label: 'Mood photo (banner)', type: 'image' },
			{ name: 'logoImage', label: 'Wordmark logo', type: 'image' }, sortOrder,
			{ name: 'name', label: 'Name', type: 'text', translatable: true, required: true },
			{ name: 'tagline', label: 'Tagline', type: 'text', translatable: true },
			{ name: 'description', label: 'Description', type: 'textarea', translatable: true },
			{ name: 'bannerAlt', label: 'Banner description', type: 'text', translatable: true }
		]
	},
	news: {
		key: 'news', label: 'News', singular: 'news item', table: s.news, trTable: s.newsTranslations, fk: 'newsId',
		titleField: 'title', imageField: 'coverImage', publish: { name: 'status', on: 'published', off: 'draft' }, slugFrom: 'title', order: 'date',
		fields: [
			{ name: 'coverImage', label: 'Cover image', type: 'image' },
			{ name: 'eventDate', label: 'Event date', type: 'date' },
			{ name: 'location', label: 'Location', type: 'text' },
			{ name: 'status', label: 'Status', type: 'select', options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }] },
			{ name: 'title', label: 'Title', type: 'text', translatable: true, required: true },
			{ name: 'excerpt', label: 'Excerpt', type: 'textarea', translatable: true },
			{ name: 'bodyMd', label: 'Body', type: 'markdown', translatable: true },
			{ name: 'coverAlt', label: 'Cover description', type: 'text', translatable: true }
		]
	},
	testimonials: {
		key: 'testimonials', label: 'Testimonials', singular: 'testimonial', table: s.testimonials, trTable: s.testimonialTranslations, fk: 'testimonialId',
		titleField: 'title', imageField: 'posterImage', publish: publishFlag, slugFrom: null, order: 'sort',
		fields: [
			{ name: 'kind', label: 'Shown on', type: 'select', options: [{ value: 'video', label: 'Videos page' }, { value: 'testimonial', label: 'Testimonials page' }] },
			{ name: 'youtubeUrl', label: 'YouTube URL', type: 'url', required: true },
			{ name: 'posterImage', label: 'Poster image', type: 'image', help: 'Shown before the video loads. Without one, no image request is made to YouTube.' },
			{ name: 'personName', label: 'Person name', type: 'text' },
			{ name: 'role', label: 'Role', type: 'text' },
			published, sortOrder,
			{ name: 'title', label: 'Video title', type: 'text', translatable: true, required: true },
			{ name: 'quote', label: 'Quote', type: 'textarea', translatable: true }
		]
	},
	accolades: {
		key: 'accolades', label: 'Accolades', singular: 'accolade', table: s.accolades, trTable: s.accoladeTranslations, fk: 'accoladeId',
		titleField: 'title', imageField: 'image', publish: publishFlag, slugFrom: null, order: 'sort',
		fields: [
			{ name: 'image', label: 'Certificate image', type: 'image', required: true },
			{ name: 'year', label: 'Year', type: 'number' },
			{ name: 'issuer', label: 'Issued by', type: 'text' },
			published, sortOrder,
			{ name: 'title', label: 'Title', type: 'text', translatable: true, required: true },
			{ name: 'description', label: 'Description', type: 'textarea', translatable: true },
			{ name: 'imageAlt', label: 'Image description', type: 'text', translatable: true }
		]
	}
};

export const getEntity = (key: string): Entity | null => (ENTITIES as Record<string, Entity>)[key] ?? null;

export function clientEntity(e: Entity) {
	return { key: e.key, label: e.label, singular: e.singular, fields: e.fields, titleField: e.titleField, publish: e.publish, hasBestSeller: e.fields.some((f) => f.name === 'isBestSeller') };
}
