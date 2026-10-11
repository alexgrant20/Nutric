import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { createDb, type Db } from '../src/lib/server/db';
import * as s from '../src/lib/server/db/schema';
import { createAdminUser } from '../src/lib/server/auth';
import { ensureSections } from '../src/lib/server/sections';
import { youtubeId } from '../src/lib/youtube';
import { SEED_LANGS, type SeedData } from './seed-types';

const up = (f: string | null) => (f ? `/uploads/seed/${f}` : null);

export function loadSeed(db: Db, data: SeedData, opts: { copyImagesTo?: string; imagesFrom?: string } = {}): void {
	if (opts.copyImagesTo) {
		const dir = join(opts.copyImagesTo, 'seed');
		mkdirSync(dir, { recursive: true });
		const from = opts.imagesFrom ?? 'seed/images';
		const files = new Set<string>();
		const add = (f: string | null | undefined) => f && files.add(f);
		add(data.settings.logoImage); add(data.settings.heroMedia); add(data.settings.heroProductImage);
		data.collections.forEach((c) => add(c.bannerImage));
		data.products.forEach((p) => { add(p.mainImage); p.gallery.forEach(add); });
		data.news.forEach((n) => add(n.coverImage));
		data.accolades.forEach((a) => add(a.image));
		data.testimonials.forEach((x) => add(x.posterImage));
		for (const f of files) if (existsSync(join(from, f))) copyFileSync(join(from, f), join(dir, f));
	}

	db.transaction((tx) => {
		for (const t of [s.collections, s.products, s.news, s.testimonials, s.accolades, s.siteSettingsTranslations, s.siteSettings]) {
			tx.delete(t).run();
		}
		tx.insert(s.siteSettings).values({
			id: 1, brandName: data.settings.brandName, logoImage: up(data.settings.logoImage),
			heroMedia: up(data.settings.heroMedia), heroMediaType: data.settings.heroMediaType,
			heroProductImage: up(data.settings.heroProductImage), contactEmail: data.settings.contactEmail,
			contactPhone: data.settings.contactPhone, whatsappUrl: data.settings.whatsappUrl, socialLinks: data.settings.socialLinks
		}).run();
		for (const l of SEED_LANGS) {
			const t = data.settings.t[l];
			if (t) tx.insert(s.siteSettingsTranslations).values({ lang: l, ...t }).run();
		}

		const collectionIds = new Map<string, number>();
		for (const c of data.collections) {
			const row = tx.insert(s.collections).values({ slug: c.slug, bannerImage: up(c.bannerImage), sortOrder: c.sortOrder }).returning().get();
			collectionIds.set(c.slug, row.id);
			for (const l of SEED_LANGS) if (c.t[l]) tx.insert(s.collectionTranslations).values({ collectionId: row.id, lang: l, ...c.t[l]! }).run();
		}
		for (const p of data.products) {
			const row = tx.insert(s.products).values({
				slug: p.slug, collectionId: p.collectionSlug ? (collectionIds.get(p.collectionSlug) ?? null) : null,
				mainImage: up(p.mainImage), gallery: p.gallery.map((g) => up(g)!), isBestSeller: p.isBestSeller,
				isPublished: true, sortOrder: p.sortOrder
			}).returning().get();
			for (const l of SEED_LANGS) if (p.t[l]) tx.insert(s.productTranslations).values({ productId: row.id, lang: l, ...p.t[l]! }).run();
		}
		for (const n of data.news) {
			const row = tx.insert(s.news).values({
				slug: n.slug, coverImage: up(n.coverImage), eventDate: n.eventDate, location: n.location,
				status: 'published', publishedAt: Math.floor(Date.now() / 1000)
			}).returning().get();
			for (const l of SEED_LANGS) if (n.t[l]) tx.insert(s.newsTranslations).values({ newsId: row.id, lang: l, ...n.t[l]! }).run();
		}
		for (const tm of data.testimonials) {
			if (!youtubeId(tm.youtubeUrl)) continue;
			const row = tx.insert(s.testimonials).values({
				personName: tm.personName, role: tm.role, youtubeUrl: tm.youtubeUrl, posterImage: up(tm.posterImage), isPublished: true, sortOrder: tm.sortOrder
			}).returning().get();
			for (const l of SEED_LANGS) if (tm.t[l]) tx.insert(s.testimonialTranslations).values({ testimonialId: row.id, lang: l, ...tm.t[l]! }).run();
		}
		for (const a of data.accolades) {
			const row = tx.insert(s.accolades).values({
				image: up(a.image)!, year: a.year, issuer: a.issuer, isPublished: true, sortOrder: a.sortOrder
			}).returning().get();
			for (const l of SEED_LANGS) if (a.t[l]) tx.insert(s.accoladeTranslations).values({ accoladeId: row.id, lang: l, ...a.t[l]! }).run();
		}
	});
	ensureSections(db);
}

async function cli() {
	const args = process.argv.slice(2);
	const dbPath = args[args.indexOf('--db') + 1] || process.env.DATABASE_PATH || 'data/nutric.db';
	const uploadDir = process.env.UPLOAD_DIR || 'data/uploads';
	const email = process.env.ADMIN_EMAIL;
	const password = process.env.ADMIN_PASSWORD;
	if (!email || !password || password.length < 12) {
		console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) in .env first.');
		process.exit(1);
	}
	const db = createDb(dbPath);
	loadSeed(db, JSON.parse(readFileSync('seed/data.json', 'utf8')) as SeedData, { copyImagesTo: uploadDir });
	await createAdminUser(db, email, password);
	console.log(`Seeded ${dbPath}; images in ${uploadDir}/seed; admin ${email}`);
}
if (process.argv[1] && /seed\.ts$/.test(process.argv[1])) cli().catch((e) => { console.error(e); process.exit(1); });
