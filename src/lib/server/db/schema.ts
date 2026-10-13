import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

const stamps = {
	createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
	updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`)
};
const id = () => integer('id').primaryKey({ autoIncrement: true });
const flag = (name: string, def = false) => integer(name, { mode: 'boolean' }).notNull().default(def);

export const collections = sqliteTable('collections', {
	id: id(),
	slug: text('slug').notNull().unique(),
	bannerImage: text('banner_image'),
	logoImage: text('logo_image'),
	sortOrder: integer('sort_order').notNull().default(0),
	...stamps
});
export const collectionTranslations = sqliteTable(
	'collection_translations',
	{
		id: id(),
		collectionId: integer('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
		lang: text('lang').notNull(),
		name: text('name').notNull(),
		tagline: text('tagline'),
		description: text('description'),
		bannerAlt: text('banner_alt')
	},
	(t) => [unique().on(t.collectionId, t.lang)]
);

export const products = sqliteTable('products', {
	id: id(),
	slug: text('slug').notNull().unique(),
	collectionId: integer('collection_id').references(() => collections.id, { onDelete: 'set null' }),
	mainImage: text('main_image'),
	gallery: text('gallery', { mode: 'json' }).$type<string[]>().notNull().default([]),
	isBestSeller: flag('is_best_seller'),
	isPublished: flag('is_published'),
	sortOrder: integer('sort_order').notNull().default(0),
	...stamps
});
export const productTranslations = sqliteTable(
	'product_translations',
	{
		id: id(),
		productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
		lang: text('lang').notNull(),
		name: text('name').notNull(),
		shortDescription: text('short_description'),
		descriptionMd: text('description_md'),
		benefits: text('benefits', { mode: 'json' }).$type<string[]>().notNull().default([]),
		ingredientsMd: text('ingredients_md'),
		howToUseMd: text('how_to_use_md'),
		faqs: text('faqs', { mode: 'json' }).$type<{ q: string; a: string }[]>().notNull().default([]),
		regulatoryText: text('regulatory_text'),
		imageAlt: text('image_alt')
	},
	(t) => [unique().on(t.productId, t.lang)]
);

export const news = sqliteTable('news', {
	id: id(),
	slug: text('slug').notNull().unique(),
	coverImage: text('cover_image'),
	eventDate: text('event_date'),
	location: text('location'),
	status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
	publishedAt: integer('published_at'),
	...stamps
});
export const newsTranslations = sqliteTable(
	'news_translations',
	{
		id: id(),
		newsId: integer('news_id').notNull().references(() => news.id, { onDelete: 'cascade' }),
		lang: text('lang').notNull(),
		title: text('title').notNull(),
		excerpt: text('excerpt'),
		bodyMd: text('body_md'),
		coverAlt: text('cover_alt')
	},
	(t) => [unique().on(t.newsId, t.lang)]
);

export const testimonials = sqliteTable('testimonials', {
	id: id(),
	// "video" rows fill the Videos page and landing stage; "testimonial" rows fill the Testimonials page.
	kind: text('kind', { enum: ['video', 'testimonial'] }).notNull().default('video'),
	personName: text('person_name'),
	role: text('role'),
	avatarImage: text('avatar_image'),
	youtubeUrl: text('youtube_url'),
	posterImage: text('poster_image'),
	isPublished: flag('is_published'),
	sortOrder: integer('sort_order').notNull().default(0),
	...stamps
});
export const testimonialTranslations = sqliteTable(
	'testimonial_translations',
	{
		id: id(),
		testimonialId: integer('testimonial_id').notNull().references(() => testimonials.id, { onDelete: 'cascade' }),
		lang: text('lang').notNull(),
		title: text('title').notNull(),
		quote: text('quote')
	},
	(t) => [unique().on(t.testimonialId, t.lang)]
);

export const accolades = sqliteTable('accolades', {
	id: id(),
	image: text('image').notNull(),
	year: integer('year'),
	issuer: text('issuer'),
	isPublished: flag('is_published'),
	sortOrder: integer('sort_order').notNull().default(0),
	...stamps
});
export const accoladeTranslations = sqliteTable(
	'accolade_translations',
	{
		id: id(),
		accoladeId: integer('accolade_id').notNull().references(() => accolades.id, { onDelete: 'cascade' }),
		lang: text('lang').notNull(),
		title: text('title').notNull(),
		description: text('description'),
		imageAlt: text('image_alt')
	},
	(t) => [unique().on(t.accoladeId, t.lang)]
);

export const pageSections = sqliteTable('page_sections', {
	id: id(),
	key: text('key').notNull().unique(),
	position: integer('position').notNull(),
	isEnabled: flag('is_enabled', true)
});

export type ThemeJson = {
	colors: Record<'forest900' | 'forest700' | 'cream100' | 'ink900' | 'stone600' | 'lime400', string>;
	fonts: { sans: string; serif: string };
	radius: { sm: number; md: number };
};
export const siteSettings = sqliteTable('site_settings', {
	id: integer('id').primaryKey(),
	brandName: text('brand_name').notNull(),
	logoImage: text('logo_image'),
	heroMedia: text('hero_media'),
	heroMediaType: text('hero_media_type', { enum: ['image', 'video'] }).notNull().default('image'),
	heroProductImage: text('hero_product_image'),
	contactEmail: text('contact_email'),
	contactPhone: text('contact_phone'),
	whatsappUrl: text('whatsapp_url'),
	socialLinks: text('social_links', { mode: 'json' }).$type<{ platform: string; url: string }[]>().notNull().default([]),
	theme: text('theme', { mode: 'json' }).$type<ThemeJson>(),
	updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`)
});
export const siteSettingsTranslations = sqliteTable('site_settings_translations', {
	id: id(),
	lang: text('lang').notNull().unique(),
	tagline: text('tagline'),
	headlineLine1: text('headline_line1'),
	headlineLine2: text('headline_line2'),
	subheadline: text('subheadline'),
	ctaLabel: text('cta_label'),
	heroBadgeText: text('hero_badge_text'),
	aboutTeaserMd: text('about_teaser_md'),
	aboutMd: text('about_md'),
	termsMd: text('terms_md'),
	aboutImageAlt: text('about_image_alt'),
	footerNote: text('footer_note')
});

export const subscribers = sqliteTable('subscribers', {
	id: id(),
	email: text('email').notNull().unique(),
	lang: text('lang').notNull().default('en'),
	createdAt: integer('created_at').notNull().default(sql`(unixepoch())`)
});

export const adminUsers = sqliteTable('admin_users', {
	id: id(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: integer('created_at').notNull().default(sql`(unixepoch())`)
});
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: integer('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at').notNull()
});
