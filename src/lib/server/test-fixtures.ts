import type { Db } from './db';
import * as s from './db/schema';
import { ensureSections } from './sections';

export function seedFixture(db: Db) {
	ensureSections(db);
	db.insert(s.siteSettings).values({ id: 1, brandName: 'Fixture Brand' }).run();
	db.insert(s.siteSettingsTranslations)
		.values({
			lang: 'en', tagline: 'Tag', headlineLine1: 'Line one', headlineLine2: 'Line two',
			subheadline: 'Sub', aboutTeaserMd: 'About **teaser**', aboutMd: 'About full'
		})
		.run();

	const col = db.insert(s.collections).values({ slug: 'revolutic' }).returning().get();
	db.insert(s.collectionTranslations).values({ collectionId: col.id, lang: 'en', name: 'Revolutic' }).run();
	const emptyCol = db.insert(s.collections).values({ slug: 'empty' }).returning().get();
	db.insert(s.collectionTranslations).values({ collectionId: emptyCol.id, lang: 'en', name: 'Empty' }).run();

	const p1 = db.insert(s.products).values({ slug: 'biospray', collectionId: col.id, isPublished: true, isBestSeller: true, sortOrder: 1 }).returning().get();
	db.insert(s.productTranslations).values([
		{ productId: p1.id, lang: 'en', name: 'BioSpray' },
		{ productId: p1.id, lang: 'zh', name: '生物喷雾' }
	]).run();
	const p2 = db.insert(s.products).values({ slug: 'green-mix', collectionId: col.id, isPublished: true, sortOrder: 2 }).returning().get();
	db.insert(s.productTranslations).values({ productId: p2.id, lang: 'en', name: 'Green Mix' }).run();
	const p3 = db.insert(s.products).values({ slug: 'draft-product', collectionId: col.id, isPublished: false, isBestSeller: true, sortOrder: 0 }).returning().get();
	db.insert(s.productTranslations).values({ productId: p3.id, lang: 'en', name: 'Draft' }).run();
	const p4 = db.insert(s.products).values({ slug: 'zh-only', collectionId: col.id, isPublished: true, sortOrder: 3 }).returning().get();
	db.insert(s.productTranslations).values({ productId: p4.id, lang: 'zh', name: '仅中文' }).run();

	const n1 = db.insert(s.news).values({ slug: 'news-older', status: 'published', eventDate: '2017-01-10' }).returning().get();
	const n2 = db.insert(s.news).values({ slug: 'news-newer', status: 'published', eventDate: '2017-11-03' }).returning().get();
	const n3 = db.insert(s.news).values({ slug: 'news-draft', status: 'draft', eventDate: '2018-01-01' }).returning().get();
	for (const n of [n1, n2, n3]) db.insert(s.newsTranslations).values({ newsId: n.id, lang: 'en', title: `Title ${n.slug}` }).run();

	const tm = db.insert(s.testimonials).values({ youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ', isPublished: true }).returning().get();
	db.insert(s.testimonialTranslations).values({ testimonialId: tm.id, lang: 'en', title: 'A video' }).run();

	const ac = db.insert(s.accolades).values({ image: '/uploads/x.jpg', year: 2016, isPublished: true }).returning().get();
	db.insert(s.accoladeTranslations).values({ accoladeId: ac.id, lang: 'en', title: 'An award' }).run();
}
