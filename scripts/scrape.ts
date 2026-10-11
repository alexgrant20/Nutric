import { chromium, type Page } from 'playwright';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { slugify } from '../src/lib/slug';
import { SEED_LANGS, type SeedData, type SeedLang } from './seed-types';
import {
	aboutToMarkdown, collectionSlugFor, faqsFromPairs, newsBodyFromI18n, parseNewsDate, regulatoryExpiry, splitBenefits
} from './scrape-lib';

const BASE = 'https://www.nutric.com';
const I18N_FILE: Record<SeedLang, string> = { en: 'en', ms: 'ms', id: 'id', zh: 'zh', 'zh-tw': 'zh_tw', th: 'th' };
const LS_LANG = I18N_FILE;
const IMG_DIR = 'seed/images';
const missing: string[] = [];
const note = (m: string) => missing.push(m);

mkdirSync(IMG_DIR, { recursive: true });

async function download(url: string): Promise<string | null> {
	const abs = url.startsWith('http') ? url : `${BASE}/${url.replace(/^\//, '')}`;
	const name = basename(new URL(abs).pathname);
	const dest = join(IMG_DIR, name);
	if (existsSync(dest)) return name;
	const res = await fetch(abs);
	if (!res.ok) { note(`download failed ${res.status}: ${abs}`); return null; }
	writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
	return name;
}

async function i18n(lang: SeedLang): Promise<Record<string, any>> {
	const res = await fetch(`${BASE}/assets/i18n/${I18N_FILE[lang]}.json`);
	if (!res.ok) throw new Error(`i18n ${lang}: ${res.status}`);
	return res.json();
}

async function openIn(page: Page, path: string, lang: SeedLang) {
	await page.goto(BASE, { waitUntil: 'domcontentloaded' });
	await page.evaluate((l) => localStorage.setItem('lang', l), LS_LANG[lang]);
	await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1500);
}

type RawProduct = {
	name: string; tagline: string; images: string[]; descriptionHtml: string;
	faqPairs: [string, string][]; regulatory: string;
};
async function readProducts(page: Page): Promise<RawProduct[]> {
	const count = await page.locator('mat-tab-group').count();
	const out: RawProduct[] = [];
	for (let i = 0; i < count; i++) {
		const group = page.locator('mat-tab-group').nth(i);
		const descriptionHtml = await group.locator('.mat-tab-body-active').innerHTML();
		await group.evaluate((el) => (el.querySelectorAll('.mat-tab-label')[1] as HTMLElement | undefined)?.click());
		await page.waitForTimeout(600);
		const faqPairs = (await group.locator('mat-expansion-panel').evaluateAll((panels) =>
			panels.map((p) => [
				(p.querySelector('mat-panel-title')?.textContent ?? '').trim(),
				(p.querySelector('.mat-expansion-panel-body')?.textContent ?? '').trim()
			])
		)) as [string, string][];
		const meta = await group.evaluate((el) => {
			const c = el.parentElement!;
			const clone = c.cloneNode(true) as HTMLElement;
			clone.querySelectorAll('mat-tab-group,h3,p.short-desc,img').forEach((n) => n.remove());
			return {
				name: c.querySelector('h3')?.textContent?.trim() ?? '',
				tagline: c.querySelector('p.short-desc')?.textContent?.trim() ?? '',
				images: [...c.querySelectorAll('img')].map((x) => x.getAttribute('src') ?? '').filter((s) => s.includes('product-package')),
				regulatory: (clone.innerText ?? '').trim()
			};
		});
		out.push({ ...meta, descriptionHtml, faqPairs });
	}
	return out;
}

async function main() {
	const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--disable-gpu', '--disable-dev-shm-usage'] });
	const page = await browser.newPage();
	const langs = SEED_LANGS;

	const dicts = Object.fromEntries(await Promise.all(langs.map(async (l) => [l, await i18n(l)]))) as Record<SeedLang, Record<string, any>>;

	// ---- products (per language; blocks are matched by index, English defines the identity)
	const productsByLang: Partial<Record<SeedLang, RawProduct[]>> = {};
	for (const l of langs) {
		await openIn(page, '/products', l);
		productsByLang[l] = await readProducts(page);
		console.log(`products ${l}: ${productsByLang[l]!.length}`);
	}
	const en = productsByLang.en!;
	for (const l of langs) if (productsByLang[l]!.length !== en.length) note(`products ${l}: ${productsByLang[l]!.length} blocks, English has ${en.length}; indices may not align`);

	const products: SeedData['products'] = [];
	for (let i = 0; i < en.length; i++) {
		const e = en[i];
		const slug = slugify(e.name, `product-${i + 1}`);
		const t: SeedData['products'][number]['t'] = {};
		for (const l of langs) {
			const r = productsByLang[l]![i];
			if (!r) continue;
			const { descriptionHtml, benefits } = splitBenefits(r.descriptionHtml.replace(/<!---->/g, '').replace(/ _ng\w+-c\d+=""/g, ''));
			t[l] = {
				name: r.name, shortDescription: r.tagline || null, descriptionMd: htmlToMarkdown(descriptionHtml) || null,
				benefits, ingredientsMd: null, howToUseMd: null, faqs: faqsFromPairs(r.faqPairs),
				regulatoryText: r.regulatory || null, imageAlt: r.name
			};
		}
		const imgs = (await Promise.all(e.images.map(download))).filter(Boolean) as string[];
		const main = imgs.find((n) => /_1\./.test(n)) ?? imgs[0] ?? null;
		products.push({
			slug, collectionSlug: collectionSlugFor(e.name), mainImage: main, gallery: imgs,
			isBestSeller: i === 0, sortOrder: i, t
		});
		const expiry = regulatoryExpiry(e.regulatory);
		if (expiry && expiry < new Date().toISOString().slice(0, 10)) note(`product "${e.name}": advertisement approval expired ${expiry}`);
		if (!t.en?.faqs.length) note(`product "${e.name}": no FAQs found`);
	}

	// ---- collections
	const collections: SeedData['collections'] = [];
	for (const [i, brand] of ['revolutic', 'vitanetic', 'skinetique'].entries()) {
		const banner = await download(`assets/images/${brand}-banner.png`);
		const name = brand[0].toUpperCase() + brand.slice(1);
		collections.push({
			slug: brand, bannerImage: banner, sortOrder: i,
			t: Object.fromEntries(langs.map((l) => [l, { name, tagline: null, description: null, bannerAlt: name }]))
		});
	}

	// ---- news
	await openIn(page, '/news', 'en');
	const cards = await page.locator('mat-card').evaluateAll((els) =>
		els.map((c) => ({
			img: c.querySelector('img')?.getAttribute('src') ?? '',
			title: c.querySelector('.news-title')?.textContent?.trim() ?? '',
			date: c.querySelector('.date-label')?.textContent?.trim() ?? ''
		}))
	);
	const news: SeedData['news'] = [];
	for (let n = 1; n <= 4; n++) {
		const en = newsBodyFromI18n(dicts.en.NEWS, n);
		if (!en) continue;
		const card = cards.find((c) => c.title === en.title);
		if (!card) note(`news ${n}: no matching card on /news`);
		const cover = card ? await download(card.img) : null;
		const date = card ? parseNewsDate(card.date) : null;
		if (!date) note(`news ${n}: date not parsed`);
		const t: SeedData['news'][number]['t'] = {};
		for (const l of langs) {
			const b = newsBodyFromI18n(dicts[l].NEWS ?? {}, n);
			if (b) t[l] = { ...b, coverAlt: b.title };
		}
		news.push({ slug: slugify(en.title, `news-${n}`), coverImage: cover, eventDate: date, location: null, t });
	}

	// ---- accolades (images only)
	await openIn(page, '/accolades', 'en');
	const accImgs = await page.evaluate(() =>
		[...document.images].map((i) => i.getAttribute('src') ?? '')
			.filter((s) => s && !/Logo|banner|dsam|flag/i.test(s))
	);
	const accolades: SeedData['accolades'] = [];
	for (const [i, src] of [...new Set(accImgs)].entries()) {
		const f = await download(src);
		if (!f) continue;
		const year = Number(f.match(/^(20\d\d)-\d+\./)?.[1]) || null;
		const title = year ? `Accolade ${year}` : `Accolade ${i + 1}`;
		accolades.push({ image: f, year, issuer: null, sortOrder: i, t: { en: { title, description: null, imageAlt: title } } });
	}
	if (accolades.length) note(`accolades: ${accolades.length} images found; the year is read from the image file name (for example 2018-1.png) and is unverified; titles and issuers are NOT on the source site, fill them in the admin`);
	else note('accolades: no images found on /accolades');

	// ---- settings
	const logo = await download('assets/images/NUTRIC_Logo.png');
	const heroVideo = await download('assets/home.mp4').catch(() => null);
	const settingsT: SeedData['settings']['t'] = {};
	for (const l of langs) {
		const about = dicts[l].ABOUTUS ?? {};
		const aboutMd = aboutToMarkdown(about);
		settingsT[l] = {
			tagline: null, headlineLine1: null, headlineLine2: null, subheadline: null, ctaLabel: null, heroBadgeText: null,
			aboutTeaserMd: about['NUTRIC-1'] ?? null, aboutMd, termsMd: null, aboutImageAlt: null, footerNote: null
		};
	}
	// Terms and privacy text from /term-of-service, per language, stored verbatim.
	for (const l of langs) {
		await openIn(page, '/term-of-service', l);
		const html = await page.locator('div.container:has(p.MsoNormal)').first().innerHTML().catch(() => '');
		const md = htmlToMarkdown(html.replace(/<!---->/g, '').replace(/ _ng\w+-c\d+=""/g, ''));
		settingsT[l]!.termsMd = md || null;
		if (!md) note(`terms (${l}): page text not found`);
	}
	note('terms: the source page is "Terms and conditions for online purchase" for NUTRIC INDONESIA (PT I Link Age International Indonesia) and includes a Privacy Policy section; it is stored verbatim as the site terms page, but it describes an online store this site does not have. Nutric should confirm or replace it before launch');

	// Hero copy from the source home page (English), then the translated product taglines per language.
	await openIn(page, '/', 'en');
	const homeLine = (await page.locator('body').innerText()).split('\n').map((x) => x.trim()).find((x) => /regenerative healthcare/i.test(x));
	for (const l of langs) {
		const p = productsByLang[l]?.[0];
		const full = (l === 'en' ? (homeLine ?? p?.tagline) : p?.tagline) ?? '';
		// The source tagline is "<headline> - <supporting sentence>" (English) or "<headline>. <supporting sentence>" (other languages).
		const [head, ...rest] = full.split(/\s+-\s+|\.\s+/);
		settingsT[l]!.headlineLine1 = head?.replace(/\.$/, '').trim() || null;
		settingsT[l]!.headlineLine2 = null;
		settingsT[l]!.subheadline = rest.join(' ').trim() || null;
	}
	note('settings: hero headline is the first part of the source tagline (one line); a second line is not on the source site, add one in the admin (Settings > Texts by language) if wanted');
	note('settings: contact email/phone/WhatsApp not collected; add them in the admin to enable the contact buttons');

	const badge: Partial<Record<SeedLang, string>> = existsSync('seed/curated/hero-badge.json')
		? JSON.parse(readFileSync('seed/curated/hero-badge.json', 'utf8'))
		: {};
	for (const l of langs) settingsT[l]!.heroBadgeText = badge[l] ?? badge.en ?? null;
	if (badge.en?.startsWith('[')) note('hero badge: PLACEHOLDER text "' + badge.en + '"; replace it in Admin > Settings > Texts by language, or clear it to hide the badge');

	const data: SeedData = {
		generatedAt: new Date().toISOString(),
		settings: {
			brandName: 'Nutric', logoImage: logo, heroMedia: heroVideo, heroMediaType: heroVideo ? 'video' : 'image',
			heroProductImage: products[0]?.mainImage ?? null, contactEmail: null, contactPhone: null, whatsappUrl: null,
			socialLinks: [
				{ platform: 'facebook', url: 'https://www.facebook.com/nutric.corporate/' },
				{ platform: 'instagram', url: 'https://www.instagram.com/nutric.official/' },
				{ platform: 'youtube', url: 'https://www.youtube.com/c/nutricofficial' }
			],
			t: settingsT
		},
		collections, products, news, accolades,
		testimonials: loadCuratedTestimonials()
	};

	writeFileSync('seed/data.json', JSON.stringify(data, null, 2));
	writeFileSync('seed/REPORT.md', buildReport(data));
	await browser.close();
	console.log('seed/data.json and seed/REPORT.md written');
}

function loadCuratedTestimonials(): SeedData['testimonials'] {
	const p = 'seed/curated/testimonials.json';
	if (!existsSync(p)) { note('testimonials: no seed/curated/testimonials.json'); return []; }
	const list = JSON.parse(readFileSync(p, 'utf8')) as { youtubeUrl: string; title: string; personName?: string; role?: string; quote?: string }[];
	if (!list.length) note('testimonials: curated list is empty; the testimonials section stays hidden');
	return list.map((x, i) => ({
		personName: x.personName ?? null, role: x.role ?? null, youtubeUrl: x.youtubeUrl, sortOrder: i,
		t: { en: { title: x.title, quote: x.quote ?? null } }
	}));
}

function htmlToMarkdown(html: string): string {
	return html
		.replace(/<br\s*\/?>/g, '\n')
		.replace(/<\/(p|div|h[1-6])>/g, '\n\n')
		.replace(/<li[^>]*>/g, '- ')
		.replace(/<\/li>/g, '\n')
		.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/g, '**$2**')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function buildReport(d: SeedData): string {
	const counts = [
		`products: ${d.products.length}`, `collections: ${d.collections.length}`, `news: ${d.news.length}`,
		`accolades: ${d.accolades.length}`, `testimonials: ${d.testimonials.length}`
	];
	const perLang = SEED_LANGS.map((l) => `- ${l}: ${d.products.filter((p) => p.t[l]).length} products, ${d.news.filter((n) => n.t[l]).length} news`);
	return `# Seed report\n\nGenerated ${d.generatedAt}\n\n## Counts\n${counts.map((c) => `- ${c}`).join('\n')}\n\n## Translations found\n${perLang.join('\n')}\n\n## Missing or needs attention\n${missing.length ? missing.map((m) => `- ${m}`).join('\n') : '- nothing'}\n`;
}

main().catch((e) => { console.error(e); process.exit(1); });
