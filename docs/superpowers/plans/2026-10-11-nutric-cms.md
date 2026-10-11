# Nutric CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (execution method chosen by the user: native, inline in one session, no subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Nutric single-landing-page website and its custom admin panel in SvelteKit, seeded from nutric.com in 6 languages.

**Architecture:** One SvelteKit app. SQLite (Drizzle) holds base tables plus per-language translation tables; public pages live under `/[lang]/...`; `/admin` is a generic CRUD panel driven by one field registry. A one-off Playwright script scrapes nutric.com into `seed/data.json`; `npm run seed` loads it.

**Tech Stack:** SvelteKit (Svelte 5, TS, adapter-node), Tailwind v4, better-sqlite3 + Drizzle, Zod, @node-rs/argon2, marked + sanitize-html, Vitest, Playwright + axe-core, tsx.

**Spec:** `docs/superpowers/specs/2026-10-11-nutric-cms-design.md` (read it first; this plan implements all of it).

## Global Constraints

- Svelte 5 runes mode, TypeScript strict. `adapter-node`. Tailwind v4 with `@theme inline` so utilities read runtime CSS variables.
- Languages: `en`, `ms`, `id`, `zh`, `zh-tw`, `th`; default `en`. URL prefix `/[lang]/...`.
- No em dash character (U+2014) in any UI text, dictionary value, seed-authored text, or in this plan. A test enforces it for dictionaries.
- Modules under `src/lib/server/**`, `src/lib/i18n/translate.ts`, `src/lib/i18n/config.ts`, `src/lib/slug.ts`, `src/lib/youtube.ts`, `src/lib/theme/**` use **relative imports only** and never import `$app/*`, `$env/*`, or `$lib`, because `scripts/*.ts` run them under `tsx` outside SvelteKit.
- Every visitor-facing string comes from `src/lib/i18n/*.json` or the database. No literal visitor text in components.
- Design tokens (spec 11.3): `--forest-900 #12241A`, `--forest-700 #1F3B2A`, `--cream-100 #F4F1E8`, `--ink-900 #1B1F1C`, `--stone-600 #5A6159`, `--lime-400 #C8F07A`. Lime only on: primary hero CTA, "Best seller" marker, focus ring on dark surfaces, active language.
- Radius scale: `4px` (sm), `12px` (md), pill only on the one primary hero CTA. Shadow only on the best-seller card and dialogs/lightbox. Blur (glass) only on the hero testimonial card. No glow, no grid/dots background, no arrows on buttons.
- Fonts self-hosted via `@fontsource` (Poppins, Fraunces, Noto Sans/Serif SC/TC/Thai). Body text never below 16px.
- CTAs name the action ("See {name}", "Ask about this product", "Read the article", "View all products", "Subscribe to event updates"). Never "Get Started", "Learn More", "Explore", "Discover".
- No fabricated content: no invented testimonials, names, numbers, awards, or claims. Missing data stays empty; empty sections hide.
- Admin UI is English only. Single admin account. Session cookie `session`, httpOnly, 7 days sliding.
- Uploads: jpg/png/webp, max 5 MB, stored under `UPLOAD_DIR` (default `data/uploads`), served by `/uploads/[...path]`.
- Commit after every task. Commit message ends with the attribution line given in the session's system reminder.
- If an installed library's API differs from the code shown (the registry has newer majors than most documentation), keep the behavior and adapt the call; do not change the design.

## Spec amendments discovered while planning

These refine the spec after inspecting nutric.com and are applied in Task 0:
- Testimonials are video-first: `person_name`, `role`, `quote` are nullable; translations get a `title` (video caption).
- Accolades: `year` and `issuer` nullable (the source has images only). The timeline groups by year when years exist, otherwise shows a plain strip.
- Collections: only `name` is guaranteed (brand names from the source); tagline/description/banner alt nullable.
- `hreflang` alternates are emitted for all enabled languages (fallback guarantees every URL renders).

## Review Focus

Input classes the spec implies but the obvious tests would miss, most likely first. Each has a pinning test in the owning task (task number in brackets).

1. A news or product whose English title has no Latin letters (Chinese, Thai) must still get a unique, non-empty slug. [Task 5]
2. An entity that exists only in a non-English language, or in no language: it must not crash a page; it is skipped from public lists. [Task 5]
3. `/xx/...` with an unsupported language code, and `Accept-Language` headers with weights or regions (`zh-TW,zh;q=0.9`): redirect to a supported language, never 500. [Tasks 3, 6, 15]
4. Uploads: wrong type with a spoofed extension, oversize file, and path traversal in `/uploads/../..`. [Task 9, Task 13]
5. Newsletter: duplicate address, different letter case, whitespace, absurdly long input. [Task 10]
6. YouTube URLs in every common form (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`) and non-YouTube or `javascript:` URLs. [Task 5]
7. Markdown containing `<script>` or `javascript:` links must render inert. [Task 5]
8. Landing with zero content (everything unpublished) renders only hero headline and newsletter/footer, with no dead nav links. [Tasks 5, 15]

---

## File structure

```
.env.example                    package.json  svelte.config.js  vite.config.ts  drizzle.config.ts
playwright.config.ts            README.md
drizzle/                        generated migrations
scripts/
  scrape.ts                     scrape nutric.com -> seed/data.json, seed/images, seed/REPORT.md
  seed.ts                       load seed/data.json into DB
  seed-types.ts                 SeedData type shared by scrape and seed
  scrape-lib.ts                 pure parsing helpers (tested)
seed/                           data.json, images/, REPORT.md, curated/
src/
  app.html  app.css  app.d.ts  hooks.server.ts
  params/{lang.ts,entity.ts}
  lib/
    slug.ts  youtube.ts  markdown (server/markdown.ts)
    i18n/{config.ts,translate.ts,index.ts,en.json,ms.json,id.json,zh.json,zh-tw.json,th.json}
    theme/{contrast.ts,tokens.ts}
    server/
      db/{schema.ts,index.ts,instance.ts}
      auth.ts  rate-limit.ts  content.ts  sections.ts  markdown.ts  upload.ts
      entities.ts  entity-form.ts  entity-crud.ts  entity-actions.ts  settings-form.ts  admin-misc.ts  subscribe.ts  lang-redirect.ts  test-fixtures.ts
    components/
      ui/{Img.svelte,Reveal.ts,Dialog.svelte}
      site/{Navbar,LanguageSwitcher,Footer,Hero,BestSeller,Collections,AboutTeaser,Testimonials,YouTubeEmbed,Accolades,Lightbox,NewsSection,Newsletter,ProductCard,NewsRow}.svelte
      admin/{EntityList,EntityForm,LanguageTabs,ImageField,MarkdownField,Toast}.svelte
  routes/
    +layout.server.ts  +layout.svelte  +page.server.ts  +error.svelte
    uploads/[...path]/+server.ts
    api/subscribe/+server.ts
    [lang=lang]/ +layout.server.ts +layout.svelte +page.server.ts +page.svelte +error.svelte
      products/ +page.server.ts +page.svelte  [slug]/...
      collections/[slug]/...   news/ +page... [slug]/...   testimonials/...   accolades/...   about/...
    admin/ login/ +layout.server.ts +layout.svelte +page.* sections/ settings/ subscribers/ account/ [entity=entity]/...
e2e/ landing.spec.ts  admin.spec.ts  a11y.spec.ts  overflow.spec.ts  keyboard.spec.ts
```

---

### Task 0: Apply spec amendments

**Files:**
- Modify: `docs/superpowers/specs/2026-10-11-nutric-cms-design.md`

- [ ] **Step 1: Apply the four amendments listed above**

Run (from repo root):

```bash
python - <<'EOF'
p='docs/superpowers/specs/2026-10-11-nutric-cms-design.md'
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s, a[:60]
    s=s.replace(a,b,1)
rep("testimonials(person_name, role, avatar_image NULL, youtube_url NULL, poster_image NULL,","testimonials(person_name NULL, role NULL, avatar_image NULL, youtube_url NULL, poster_image NULL,")
rep("testimonial_translations(testimonial_id FK, lang, quote)","testimonial_translations(testimonial_id FK, lang, title, quote NULL)")
rep("accolades(image, year, issuer, is_published, sort_order)","accolades(image, year NULL, issuer NULL, is_published, sort_order)")
rep("collection_translations(collection_id FK, lang, name, tagline, description, banner_alt)","collection_translations(collection_id FK, lang, name, tagline NULL, description NULL, banner_alt NULL)")
rep("`<link rel=\"alternate\" hreflang>` is emitted for every enabled language that has a translation.","`<link rel=\"alternate\" hreflang>` is emitted for every enabled language (the English fallback guarantees every URL renders).")
rep("| 7 | Accolades (`accolades`) | Horizontal timeline by year;","| 7 | Accolades (`accolades`) | Horizontal timeline by year when items have years (plain strip otherwise);")
open(p,'w',encoding='utf-8').write(s)
EOF
git add -A docs && git commit -m "docs: spec amendments from source inspection" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

Expected: commit succeeds, no assertion error.

---

### Task 1: Scaffold, dependencies, base config

**Files:**
- Create: `package.json` (generated), `svelte.config.js`, `vite.config.ts`, `drizzle.config.ts`, `src/app.html`, `src/app.d.ts`, `.gitignore`, `.env.example`
- Test: `src/lib/smoke.test.ts` (deleted at end of task)

**Interfaces:**
- Produces: `npm run dev|build|test|seed|scrape|db:generate`; Vitest picks up `src/**/*.test.ts` and `scripts/**/*.test.ts`.

- [ ] **Step 1: Generate the scaffold in a temp folder and copy it in**

```bash
cd "C:/Users/alexg/Documents/Coding/ClaudeProject"
npx sv create .nutric-scaffold --template minimal --types ts --no-add-ons --install npm
cp -rn .nutric-scaffold/. Nutric/
rm -rf .nutric-scaffold
cd Nutric && ls
```

Expected: `package.json`, `svelte.config.js`, `vite.config.ts`, `src/`, `static/` exist in `Nutric/`, `docs/` and `.git` untouched. If `sv create` rejects a flag, run `npx sv create --help` and use the equivalent (minimal template, TypeScript, no add-ons, npm).

- [ ] **Step 2: Install dependencies**

```bash
npm i better-sqlite3 drizzle-orm zod @node-rs/argon2 marked sanitize-html \
  @fontsource/poppins @fontsource/fraunces \
  @fontsource/noto-sans-sc @fontsource/noto-sans-tc @fontsource/noto-sans-thai \
  @fontsource/noto-serif-sc @fontsource/noto-serif-tc @fontsource/noto-serif-thai
npm i -D @sveltejs/adapter-node tailwindcss @tailwindcss/vite drizzle-kit vitest tsx \
  playwright @playwright/test @axe-core/playwright @types/better-sqlite3 @types/sanitize-html
npx playwright install chromium
```

Expected: installs without error. If `better-sqlite3` fails to build on Node 24, check for a prebuilt binary release, or use the newest published version of the package.

- [ ] **Step 3: Replace `svelte.config.js`**

```js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: vitePreprocess(),
	kit: { adapter: adapter() }
};
```

- [ ] **Step 4: Replace `vite.config.ts`**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
		environment: 'node'
	}
});
```

- [ ] **Step 5: Create `drizzle.config.ts`, `.env.example`, `src/app.html`, `src/app.d.ts`**

`drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle'
});
```

`.env.example`:

```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-please-12
DATABASE_PATH=data/nutric.db
UPLOAD_DIR=data/uploads
PUBLIC_SITE_URL=http://localhost:5173
```

`src/app.html`:

```html
<!doctype html>
<html lang="%lang%">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<script>
			document.documentElement.classList.add('js');
		</script>
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

`src/app.d.ts`:

```ts
declare global {
	namespace App {
		interface Locals {
			user: { id: number; email: string } | null;
			lang: 'en' | 'ms' | 'id' | 'zh' | 'zh-tw' | 'th';
		}
	}
}
export {};
```

- [ ] **Step 6: Add scripts and gitignore, then copy `.env`**

In `package.json` set `"scripts"` to include:

```json
"dev": "vite dev",
"build": "vite build",
"preview": "vite preview",
"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
"test": "vitest run",
"test:e2e": "playwright test",
"db:generate": "drizzle-kit generate",
"scrape": "tsx scripts/scrape.ts",
"seed": "tsx scripts/seed.ts"
```

Append to `.gitignore`: `data/`, `.env`, `test-results/`, `playwright-report/`. Then `cp .env.example .env`.

- [ ] **Step 7: Verify the toolchain with a smoke test**

`src/lib/smoke.test.ts`:

```ts
import { expect, test } from 'vitest';
test('toolchain runs', () => expect(1 + 1).toBe(2));
```

Run: `npm test`. Expected: 1 passed. Run: `npm run build`. Expected: build succeeds (the default minimal page).

- [ ] **Step 8: Remove the smoke test and commit**

```bash
rm src/lib/smoke.test.ts
git add -A && git commit -m "chore: scaffold SvelteKit, Tailwind, Vitest, Drizzle config" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Database schema and client

**Files:**
- Create: `src/lib/server/db/schema.ts`, `src/lib/server/db/index.ts`, `src/lib/server/db/instance.ts`, `drizzle/*` (generated)
- Test: `src/lib/server/db/db.test.ts`

**Interfaces:**
- Produces: `createDb(path: string): Db`; `type Db`; all table exports from `schema.ts` (names below, used by every later task); `db` singleton from `instance.ts` (SvelteKit runtime only).

- [ ] **Step 1: Write the failing test**

`src/lib/server/db/db.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createDb } from './index';
import * as s from './schema';

describe('database', () => {
	it('creates all tables from migrations', () => {
		const db = createDb(':memory:');
		expect(db.select().from(s.products).all()).toEqual([]);
		expect(db.select().from(s.pageSections).all()).toEqual([]);
	});

	it('cascades translation deletes with the base row', () => {
		const db = createDb(':memory:');
		const p = db.insert(s.products).values({ slug: 'a' }).returning().get();
		db.insert(s.productTranslations).values({ productId: p.id, lang: 'en', name: 'A' }).run();
		db.delete(s.products).where(eq(s.products.id, p.id)).run();
		expect(db.select().from(s.productTranslations).all()).toEqual([]);
	});

	it('rejects a second translation for the same language', () => {
		const db = createDb(':memory:');
		const p = db.insert(s.products).values({ slug: 'a' }).returning().get();
		db.insert(s.productTranslations).values({ productId: p.id, lang: 'en', name: 'A' }).run();
		expect(() =>
			db.insert(s.productTranslations).values({ productId: p.id, lang: 'en', name: 'B' }).run()
		).toThrow();
	});
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/lib/server/db/db.test.ts`. Expected: FAIL (cannot find `./index`).

- [ ] **Step 3: Write `schema.ts`**

```ts
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
export const siteSettingsTranslations = sqliteTable(
	'site_settings_translations',
	{
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
		aboutImageAlt: text('about_image_alt'),
		footerNote: text('footer_note')
	}
);

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
```

- [ ] **Step 4: Write `index.ts` and `instance.ts`**

`index.ts`:

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema';

export function createDb(path: string) {
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
	const sqlite = new Database(path);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: 'drizzle' });
	return db;
}
export type Db = ReturnType<typeof createDb>;
```

`instance.ts` (SvelteKit runtime only; the only file in `server/` allowed to use `$env`):

```ts
import { env } from '$env/dynamic/private';
import { createDb } from './index';

export const db = createDb(env.DATABASE_PATH ?? 'data/nutric.db');
```

- [ ] **Step 5: Generate the migration and run the tests**

```bash
npx drizzle-kit generate --name init
npx vitest run src/lib/server/db/db.test.ts
```

Expected: `drizzle/0000_init.sql` created; 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: database schema and client" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: i18n core and dictionaries

**Files:**
- Create: `src/lib/i18n/config.ts`, `src/lib/i18n/translate.ts`, `src/lib/i18n/index.ts`, `src/lib/i18n/{en,ms,id,zh,zh-tw,th}.json`
- Test: `src/lib/i18n/i18n.test.ts`

**Interfaces:**
- Produces:
  - `type Lang`, `LANGUAGES` (`{code, label, htmlLang, enabled}[]`), `DEFAULT_LANG`, `enabledLangs(): Lang[]`, `isLang(x: string): x is Lang`, `htmlLangFor(l: Lang): string` from `config.ts`
  - `pickTranslation<T extends {lang: string}>(rows: T[], lang: Lang): { row: T | null; usedLang: Lang | null }`, `parseAcceptLanguage(header: string | null | undefined): Lang` from `translate.ts`
  - `t(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string`, `type DictKey` from `index.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { enabledLangs, isLang } from './config';
import { parseAcceptLanguage, pickTranslation } from './translate';
import { t } from './index';
import en from './en.json';
import ms from './ms.json';
import id from './id.json';
import zh from './zh.json';
import zhtw from './zh-tw.json';
import th from './th.json';

describe('pickTranslation', () => {
	const rows = [
		{ lang: 'en', name: 'E' },
		{ lang: 'zh', name: 'Z' }
	];
	it('returns the requested language', () => {
		expect(pickTranslation(rows, 'zh')).toEqual({ row: rows[1], usedLang: 'zh' });
	});
	it('falls back to English and reports it', () => {
		expect(pickTranslation(rows, 'th')).toEqual({ row: rows[0], usedLang: 'en' });
	});
	it('returns null when neither exists', () => {
		expect(pickTranslation([{ lang: 'zh', name: 'Z' }], 'th')).toEqual({ row: null, usedLang: null });
	});
});

describe('parseAcceptLanguage', () => {
	it.each([
		['zh-TW,zh;q=0.9,en;q=0.8', 'zh-tw'],
		['zh-CN,zh;q=0.9', 'zh'],
		['id-ID,id;q=0.9', 'id'],
		['ms-MY', 'ms'],
		['th', 'th'],
		['fr-FR,fr;q=0.9', 'en'],
		['', 'en'],
		[null, 'en'],
		['*', 'en'],
		['garbage;;;', 'en']
	])('%s -> %s', (header, expected) => {
		expect(parseAcceptLanguage(header as string | null)).toBe(expected);
	});
});

describe('config', () => {
	it('knows the six languages', () => {
		expect(enabledLangs()).toEqual(['en', 'ms', 'id', 'zh', 'zh-tw', 'th']);
		expect(isLang('zh-tw')).toBe(true);
		expect(isLang('xx')).toBe(false);
	});
});

describe('dictionaries', () => {
	const dicts = { ms, id, zh, 'zh-tw': zhtw, th } as Record<string, Record<string, string>>;
	it('all languages have exactly the English key set', () => {
		for (const [code, d] of Object.entries(dicts)) {
			expect(Object.keys(d).sort(), code).toEqual(Object.keys(en).sort());
		}
	});
	it('contains no em dash and no empty values', () => {
		for (const d of [en, ...Object.values(dicts)] as Record<string, string>[]) {
			for (const v of Object.values(d)) {
				expect(v).not.toContain('\u2014');
				expect(v.trim().length).toBeGreaterThan(0);
			}
		}
	});
	it('interpolates variables', () => {
		expect(t('en', 'hero.cta', { name: 'BioSpray' })).toBe('See BioSpray');
	});
	it('falls back to English for an unknown key', () => {
		// @ts-expect-error deliberately invalid key
		expect(t('th', 'nope.key')).toBe('nope.key');
	});
});
```

- [ ] **Step 2: Run it and see it fail** — `npx vitest run src/lib/i18n` → FAIL (modules missing).

- [ ] **Step 3: Write `config.ts`**

```ts
export const LANGUAGES = [
	{ code: 'en', label: 'English', htmlLang: 'en', enabled: true },
	{ code: 'ms', label: 'Bahasa Malaysia', htmlLang: 'ms', enabled: true },
	{ code: 'id', label: 'Indonesian', htmlLang: 'id', enabled: true },
	{ code: 'zh', label: '中文', htmlLang: 'zh-CN', enabled: true },
	{ code: 'zh-tw', label: '繁體中文', htmlLang: 'zh-TW', enabled: true },
	{ code: 'th', label: 'ไทย', htmlLang: 'th', enabled: true }
] as const;

export type Lang = (typeof LANGUAGES)[number]['code'];
export const DEFAULT_LANG: Lang = 'en';

export function enabledLangs(): Lang[] {
	return LANGUAGES.filter((l) => l.enabled).map((l) => l.code);
}
export function isLang(x: string): x is Lang {
	return enabledLangs().includes(x as Lang);
}
export function htmlLangFor(l: Lang): string {
	return LANGUAGES.find((x) => x.code === l)?.htmlLang ?? 'en';
}
```

- [ ] **Step 4: Write `translate.ts`**

```ts
import { DEFAULT_LANG, enabledLangs, type Lang } from './config';

export function pickTranslation<T extends { lang: string }>(
	rows: T[],
	lang: Lang
): { row: T | null; usedLang: Lang | null } {
	const exact = rows.find((r) => r.lang === lang);
	if (exact) return { row: exact, usedLang: lang };
	const fallback = rows.find((r) => r.lang === DEFAULT_LANG);
	if (fallback) return { row: fallback, usedLang: DEFAULT_LANG };
	return { row: null, usedLang: null };
}

export function parseAcceptLanguage(header: string | null | undefined): Lang {
	if (!header) return DEFAULT_LANG;
	const enabled = enabledLangs();
	const tags = header
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().split(';');
			const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1);
			return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
		})
		.filter((x) => x.tag && x.tag !== '*')
		.sort((a, b) => b.q - a.q);
	for (const { tag } of tags) {
		if (tag === 'zh-tw' || tag === 'zh-hk' || tag === 'zh-hant' || tag.startsWith('zh-hant')) return 'zh-tw';
		const base = tag.split('-')[0];
		if (base === 'zh') return 'zh';
		if (enabled.includes(base as Lang)) return base as Lang;
	}
	return DEFAULT_LANG;
}
```

- [ ] **Step 5: Write `index.ts`**

```ts
import type { Lang } from './config';
import en from './en.json';
import ms from './ms.json';
import id from './id.json';
import zh from './zh.json';
import zhtw from './zh-tw.json';
import th from './th.json';

export type DictKey = keyof typeof en;
const DICTS: Record<Lang, Record<string, string>> = { en, ms, id, zh, 'zh-tw': zhtw, th };

export function t(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string {
	const raw = DICTS[lang]?.[key] ?? (en as Record<string, string>)[key] ?? key;
	return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : raw;
}
```

- [ ] **Step 6: Write the six dictionaries**

`en.json`:

```json
{
	"nav.products": "Products",
	"nav.testimonials": "Testimonials",
	"nav.accolades": "Accolades",
	"nav.news": "News",
	"nav.about": "About",
	"nav.contact": "Contact",
	"nav.menuOpen": "Open menu",
	"nav.menuClose": "Close menu",
	"nav.skip": "Skip to content",
	"nav.language": "Language",
	"hero.cta": "See {name}",
	"hero.pause": "Pause background video",
	"hero.play": "Play background video",
	"bestSeller.label": "Best seller",
	"bestSeller.view": "View details",
	"collections.title": "Our collections",
	"collections.viewAll": "View all products",
	"about.title": "About us",
	"about.more": "Read about us",
	"testimonials.title": "Testimonials",
	"testimonials.play": "Play video",
	"testimonials.loading": "Loading video",
	"testimonials.error": "The video could not load.",
	"testimonials.openYoutube": "Open it on YouTube",
	"accolades.title": "Accolades",
	"accolades.close": "Close",
	"accolades.issuedBy": "Issued by {issuer}",
	"news.title": "News and events",
	"news.viewAll": "View all news",
	"news.read": "Read the article",
	"news.back": "Back to news",
	"news.prev": "Previous article",
	"news.next": "Next article",
	"products.title": "Products",
	"products.enquire": "Ask about this product",
	"products.description": "Description",
	"products.benefits": "Benefits",
	"products.ingredients": "Ingredients",
	"products.howToUse": "How to use",
	"products.faqs": "Frequently asked questions",
	"products.related": "More from this collection",
	"common.empty": "Nothing published yet.",
	"common.notFound": "Page not found",
	"common.error": "Something went wrong",
	"common.backHome": "Back to home",
	"common.prevPage": "Previous page",
	"common.nextPage": "Next page",
	"newsletter.title": "Event updates",
	"newsletter.label": "Email address",
	"newsletter.placeholder": "email@example.com",
	"newsletter.submit": "Subscribe to event updates",
	"newsletter.sending": "Sending",
	"newsletter.success": "Thank you. You are subscribed.",
	"newsletter.invalid": "Enter a valid email address.",
	"newsletter.duplicate": "This address is already subscribed.",
	"newsletter.failed": "Could not save your address. Try again.",
	"newsletter.unavailable": "Coming soon",
	"footer.sections": "On this site",
	"footer.contact": "Contact",
	"footer.follow": "Follow us"
}
```

`ms.json`:

```json
{
	"nav.products": "Produk",
	"nav.testimonials": "Testimoni",
	"nav.accolades": "Anugerah",
	"nav.news": "Berita",
	"nav.about": "Tentang",
	"nav.contact": "Hubungi",
	"nav.menuOpen": "Buka menu",
	"nav.menuClose": "Tutup menu",
	"nav.skip": "Langkau ke kandungan",
	"nav.language": "Bahasa",
	"hero.cta": "Lihat {name}",
	"hero.pause": "Jeda video latar",
	"hero.play": "Main video latar",
	"bestSeller.label": "Terlaris",
	"bestSeller.view": "Lihat butiran",
	"collections.title": "Koleksi kami",
	"collections.viewAll": "Lihat semua produk",
	"about.title": "Tentang kami",
	"about.more": "Baca tentang kami",
	"testimonials.title": "Testimoni",
	"testimonials.play": "Main video",
	"testimonials.loading": "Memuatkan video",
	"testimonials.error": "Video tidak dapat dimuatkan.",
	"testimonials.openYoutube": "Buka di YouTube",
	"accolades.title": "Anugerah",
	"accolades.close": "Tutup",
	"accolades.issuedBy": "Dikeluarkan oleh {issuer}",
	"news.title": "Berita dan acara",
	"news.viewAll": "Lihat semua berita",
	"news.read": "Baca artikel",
	"news.back": "Kembali ke berita",
	"news.prev": "Artikel sebelumnya",
	"news.next": "Artikel seterusnya",
	"products.title": "Produk",
	"products.enquire": "Tanya tentang produk ini",
	"products.description": "Penerangan",
	"products.benefits": "Faedah",
	"products.ingredients": "Ramuan",
	"products.howToUse": "Cara penggunaan",
	"products.faqs": "Soalan lazim",
	"products.related": "Lagi daripada koleksi ini",
	"common.empty": "Belum ada yang diterbitkan.",
	"common.notFound": "Halaman tidak ditemui",
	"common.error": "Sesuatu telah berlaku",
	"common.backHome": "Kembali ke laman utama",
	"common.prevPage": "Halaman sebelumnya",
	"common.nextPage": "Halaman seterusnya",
	"newsletter.title": "Kemas kini acara",
	"newsletter.label": "Alamat e-mel",
	"newsletter.placeholder": "email@example.com",
	"newsletter.submit": "Langgan kemas kini acara",
	"newsletter.sending": "Menghantar",
	"newsletter.success": "Terima kasih. Anda telah melanggan.",
	"newsletter.invalid": "Masukkan alamat e-mel yang sah.",
	"newsletter.duplicate": "Alamat ini sudah melanggan.",
	"newsletter.failed": "Alamat anda tidak dapat disimpan. Cuba lagi.",
	"newsletter.unavailable": "Akan datang",
	"footer.sections": "Di laman ini",
	"footer.contact": "Hubungi",
	"footer.follow": "Ikuti kami"
}
```

`id.json`:

```json
{
	"nav.products": "Produk",
	"nav.testimonials": "Testimoni",
	"nav.accolades": "Penghargaan",
	"nav.news": "Berita",
	"nav.about": "Tentang",
	"nav.contact": "Kontak",
	"nav.menuOpen": "Buka menu",
	"nav.menuClose": "Tutup menu",
	"nav.skip": "Lewati ke konten",
	"nav.language": "Bahasa",
	"hero.cta": "Lihat {name}",
	"hero.pause": "Jeda video latar",
	"hero.play": "Putar video latar",
	"bestSeller.label": "Terlaris",
	"bestSeller.view": "Lihat detail",
	"collections.title": "Koleksi kami",
	"collections.viewAll": "Lihat semua produk",
	"about.title": "Tentang kami",
	"about.more": "Baca tentang kami",
	"testimonials.title": "Testimoni",
	"testimonials.play": "Putar video",
	"testimonials.loading": "Memuat video",
	"testimonials.error": "Video tidak dapat dimuat.",
	"testimonials.openYoutube": "Buka di YouTube",
	"accolades.title": "Penghargaan",
	"accolades.close": "Tutup",
	"accolades.issuedBy": "Diterbitkan oleh {issuer}",
	"news.title": "Berita dan acara",
	"news.viewAll": "Lihat semua berita",
	"news.read": "Baca artikel",
	"news.back": "Kembali ke berita",
	"news.prev": "Artikel sebelumnya",
	"news.next": "Artikel berikutnya",
	"products.title": "Produk",
	"products.enquire": "Tanyakan produk ini",
	"products.description": "Deskripsi",
	"products.benefits": "Manfaat",
	"products.ingredients": "Komposisi",
	"products.howToUse": "Cara penggunaan",
	"products.faqs": "Pertanyaan umum",
	"products.related": "Lainnya dari koleksi ini",
	"common.empty": "Belum ada yang dipublikasikan.",
	"common.notFound": "Halaman tidak ditemukan",
	"common.error": "Terjadi kesalahan",
	"common.backHome": "Kembali ke beranda",
	"common.prevPage": "Halaman sebelumnya",
	"common.nextPage": "Halaman berikutnya",
	"newsletter.title": "Info acara terbaru",
	"newsletter.label": "Alamat email",
	"newsletter.placeholder": "email@example.com",
	"newsletter.submit": "Berlangganan info acara",
	"newsletter.sending": "Mengirim",
	"newsletter.success": "Terima kasih. Anda sudah berlangganan.",
	"newsletter.invalid": "Masukkan alamat email yang valid.",
	"newsletter.duplicate": "Alamat ini sudah berlangganan.",
	"newsletter.failed": "Alamat Anda tidak dapat disimpan. Coba lagi.",
	"newsletter.unavailable": "Segera hadir",
	"footer.sections": "Di situs ini",
	"footer.contact": "Kontak",
	"footer.follow": "Ikuti kami"
}
```

`zh.json`:

```json
{
	"nav.products": "产品",
	"nav.testimonials": "客户见证",
	"nav.accolades": "荣誉奖项",
	"nav.news": "新闻",
	"nav.about": "关于我们",
	"nav.contact": "联系我们",
	"nav.menuOpen": "打开菜单",
	"nav.menuClose": "关闭菜单",
	"nav.skip": "跳到主要内容",
	"nav.language": "语言",
	"hero.cta": "查看{name}",
	"hero.pause": "暂停背景视频",
	"hero.play": "播放背景视频",
	"bestSeller.label": "畅销产品",
	"bestSeller.view": "查看详情",
	"collections.title": "产品系列",
	"collections.viewAll": "查看全部产品",
	"about.title": "关于我们",
	"about.more": "阅读关于我们",
	"testimonials.title": "客户见证",
	"testimonials.play": "播放视频",
	"testimonials.loading": "正在加载视频",
	"testimonials.error": "视频无法加载。",
	"testimonials.openYoutube": "在 YouTube 上打开",
	"accolades.title": "荣誉奖项",
	"accolades.close": "关闭",
	"accolades.issuedBy": "颁发机构：{issuer}",
	"news.title": "新闻与活动",
	"news.viewAll": "查看全部新闻",
	"news.read": "阅读文章",
	"news.back": "返回新闻",
	"news.prev": "上一篇",
	"news.next": "下一篇",
	"products.title": "产品",
	"products.enquire": "咨询此产品",
	"products.description": "产品介绍",
	"products.benefits": "功效",
	"products.ingredients": "成分",
	"products.howToUse": "使用方法",
	"products.faqs": "常见问题",
	"products.related": "同系列更多产品",
	"common.empty": "暂无已发布内容。",
	"common.notFound": "找不到页面",
	"common.error": "出了点问题",
	"common.backHome": "返回首页",
	"common.prevPage": "上一页",
	"common.nextPage": "下一页",
	"newsletter.title": "活动资讯",
	"newsletter.label": "电子邮件地址",
	"newsletter.placeholder": "email@example.com",
	"newsletter.submit": "订阅活动资讯",
	"newsletter.sending": "发送中",
	"newsletter.success": "谢谢，您已订阅。",
	"newsletter.invalid": "请输入有效的电子邮件地址。",
	"newsletter.duplicate": "该地址已订阅。",
	"newsletter.failed": "无法保存您的地址，请重试。",
	"newsletter.unavailable": "即将推出",
	"footer.sections": "本站内容",
	"footer.contact": "联系方式",
	"footer.follow": "关注我们"
}
```

`zh-tw.json`:

```json
{
	"nav.products": "產品",
	"nav.testimonials": "客戶見證",
	"nav.accolades": "榮譽獎項",
	"nav.news": "新聞",
	"nav.about": "關於我們",
	"nav.contact": "聯絡我們",
	"nav.menuOpen": "開啟選單",
	"nav.menuClose": "關閉選單",
	"nav.skip": "跳到主要內容",
	"nav.language": "語言",
	"hero.cta": "查看{name}",
	"hero.pause": "暫停背景影片",
	"hero.play": "播放背景影片",
	"bestSeller.label": "暢銷產品",
	"bestSeller.view": "查看詳情",
	"collections.title": "產品系列",
	"collections.viewAll": "查看全部產品",
	"about.title": "關於我們",
	"about.more": "閱讀關於我們",
	"testimonials.title": "客戶見證",
	"testimonials.play": "播放影片",
	"testimonials.loading": "正在載入影片",
	"testimonials.error": "影片無法載入。",
	"testimonials.openYoutube": "在 YouTube 上開啟",
	"accolades.title": "榮譽獎項",
	"accolades.close": "關閉",
	"accolades.issuedBy": "頒發機構：{issuer}",
	"news.title": "新聞與活動",
	"news.viewAll": "查看全部新聞",
	"news.read": "閱讀文章",
	"news.back": "返回新聞",
	"news.prev": "上一篇",
	"news.next": "下一篇",
	"products.title": "產品",
	"products.enquire": "諮詢此產品",
	"products.description": "產品介紹",
	"products.benefits": "功效",
	"products.ingredients": "成分",
	"products.howToUse": "使用方法",
	"products.faqs": "常見問題",
	"products.related": "同系列更多產品",
	"common.empty": "尚無已發布內容。",
	"common.notFound": "找不到頁面",
	"common.error": "發生錯誤",
	"common.backHome": "返回首頁",
	"common.prevPage": "上一頁",
	"common.nextPage": "下一頁",
	"newsletter.title": "活動資訊",
	"newsletter.label": "電子郵件地址",
	"newsletter.placeholder": "email@example.com",
	"newsletter.submit": "訂閱活動資訊",
	"newsletter.sending": "傳送中",
	"newsletter.success": "謝謝，您已訂閱。",
	"newsletter.invalid": "請輸入有效的電子郵件地址。",
	"newsletter.duplicate": "此地址已訂閱。",
	"newsletter.failed": "無法儲存您的地址，請重試。",
	"newsletter.unavailable": "即將推出",
	"footer.sections": "本站內容",
	"footer.contact": "聯絡方式",
	"footer.follow": "追蹤我們"
}
```

`th.json`:

```json
{
	"nav.products": "ผลิตภัณฑ์",
	"nav.testimonials": "เสียงจากลูกค้า",
	"nav.accolades": "รางวัล",
	"nav.news": "ข่าวสาร",
	"nav.about": "เกี่ยวกับเรา",
	"nav.contact": "ติดต่อ",
	"nav.menuOpen": "เปิดเมนู",
	"nav.menuClose": "ปิดเมนู",
	"nav.skip": "ข้ามไปยังเนื้อหา",
	"nav.language": "ภาษา",
	"hero.cta": "ดู {name}",
	"hero.pause": "หยุดวิดีโอพื้นหลัง",
	"hero.play": "เล่นวิดีโอพื้นหลัง",
	"bestSeller.label": "ขายดี",
	"bestSeller.view": "ดูรายละเอียด",
	"collections.title": "คอลเลกชันของเรา",
	"collections.viewAll": "ดูผลิตภัณฑ์ทั้งหมด",
	"about.title": "เกี่ยวกับเรา",
	"about.more": "อ่านเกี่ยวกับเรา",
	"testimonials.title": "เสียงจากลูกค้า",
	"testimonials.play": "เล่นวิดีโอ",
	"testimonials.loading": "กำลังโหลดวิดีโอ",
	"testimonials.error": "ไม่สามารถโหลดวิดีโอได้",
	"testimonials.openYoutube": "เปิดบน YouTube",
	"accolades.title": "รางวัล",
	"accolades.close": "ปิด",
	"accolades.issuedBy": "ออกโดย {issuer}",
	"news.title": "ข่าวสารและกิจกรรม",
	"news.viewAll": "ดูข่าวทั้งหมด",
	"news.read": "อ่านบทความ",
	"news.back": "กลับไปที่ข่าวสาร",
	"news.prev": "บทความก่อนหน้า",
	"news.next": "บทความถัดไป",
	"products.title": "ผลิตภัณฑ์",
	"products.enquire": "สอบถามเกี่ยวกับผลิตภัณฑ์นี้",
	"products.description": "รายละเอียด",
	"products.benefits": "คุณประโยชน์",
	"products.ingredients": "ส่วนประกอบ",
	"products.howToUse": "วิธีใช้",
	"products.faqs": "คำถามที่พบบ่อย",
	"products.related": "เพิ่มเติมจากคอลเลกชันนี้",
	"common.empty": "ยังไม่มีเนื้อหาที่เผยแพร่",
	"common.notFound": "ไม่พบหน้านี้",
	"common.error": "เกิดข้อผิดพลาด",
	"common.backHome": "กลับหน้าหลัก",
	"common.prevPage": "หน้าก่อนหน้า",
	"common.nextPage": "หน้าถัดไป",
	"newsletter.title": "ข่าวสารกิจกรรม",
	"newsletter.label": "อีเมล",
	"newsletter.placeholder": "email@example.com",
	"newsletter.submit": "สมัครรับข่าวสารกิจกรรม",
	"newsletter.sending": "กำลังส่ง",
	"newsletter.success": "ขอบคุณ คุณสมัครเรียบร้อยแล้ว",
	"newsletter.invalid": "กรุณากรอกอีเมลที่ถูกต้อง",
	"newsletter.duplicate": "อีเมลนี้สมัครไว้แล้ว",
	"newsletter.failed": "ไม่สามารถบันทึกอีเมลของคุณได้ กรุณาลองอีกครั้ง",
	"newsletter.unavailable": "เร็วๆ นี้",
	"footer.sections": "ในเว็บไซต์นี้",
	"footer.contact": "ติดต่อ",
	"footer.follow": "ติดตามเรา"
}
```

- [ ] **Step 7: Run tests** — `npx vitest run src/lib/i18n`. Expected: all pass. (The `@ts-expect-error` line needs `resolveJsonModule`, which the SvelteKit tsconfig enables.)

- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat: i18n core and six dictionaries" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`

Note for the owner: dictionaries other than English are machine-written drafts and need native-speaker review before launch (mention in README, Task 15).

---

### Task 4: Theme tokens and contrast validator

**Files:**
- Create: `src/lib/theme/contrast.ts`, `src/lib/theme/tokens.ts`
- Test: `src/lib/theme/theme.test.ts`

**Interfaces:**
- Produces:
  - `contrastRatio(fgHex: string, bgHex: string): number`
  - `type ColorKey`, `COLOR_KEYS`, `DEFAULT_THEME: Theme`, `CONTRAST_PAIRS`
  - `validateTheme(input: unknown): { ok: true; theme: Theme } | { ok: false; errors: string[] }`
  - `themeToCss(theme: Theme): string` (a `:root{...}` block, safe because values are validated hex/numbers/allowlisted names)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { CONTRAST_PAIRS, DEFAULT_THEME, themeToCss, validateTheme } from './tokens';

describe('contrastRatio', () => {
	it('is 21 for black on white and 1 for identical colors', () => {
		expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
		expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
	});
});

describe('default theme', () => {
	it('meets every listed contrast pair', () => {
		for (const p of CONTRAST_PAIRS) {
			const r = contrastRatio(DEFAULT_THEME.colors[p.fg], DEFAULT_THEME.colors[p.bg]);
			expect(r, `${p.fg} on ${p.bg} (${p.use})`).toBeGreaterThanOrEqual(p.min);
		}
	});
	it('validates', () => {
		expect(validateTheme(DEFAULT_THEME).ok).toBe(true);
	});
});

describe('validateTheme', () => {
	it('names the failing pair when contrast is too low', () => {
		const bad = structuredClone(DEFAULT_THEME);
		bad.colors.stone600 = '#d8d4c8';
		const r = validateTheme(bad);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.errors.join(' ')).toContain('stone600');
	});
	it('rejects non-hex colors, unknown fonts and out-of-range radius', () => {
		const bad = structuredClone(DEFAULT_THEME) as any;
		bad.colors.lime400 = 'red; background:url(x)';
		bad.fonts.sans = 'Comic Sans';
		bad.radius.md = 400;
		const r = validateTheme(bad);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.errors.length).toBeGreaterThanOrEqual(3);
	});
	it('rejects non-objects', () => {
		expect(validateTheme(null).ok).toBe(false);
	});
});

describe('themeToCss', () => {
	it('emits CSS variables', () => {
		const css = themeToCss(DEFAULT_THEME);
		expect(css).toContain('--forest-900:#12241A');
		expect(css).toContain('--r-sm:4px');
		expect(css).toContain("--font-latin-sans:'Poppins'");
	});
});
```

- [ ] **Step 2: Run, see it fail** — `npx vitest run src/lib/theme`.

- [ ] **Step 3: Write `contrast.ts`**

```ts
function channel(v: number): number {
	const c = v / 255;
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
export function luminance(hex: string): number {
	const h = hex.replace('#', '');
	const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
	return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrastRatio(fgHex: string, bgHex: string): number {
	const a = luminance(fgHex);
	const b = luminance(bgHex);
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
```

- [ ] **Step 4: Write `tokens.ts`**

```ts
import { z } from 'zod';
import { contrastRatio } from './contrast';

export const COLOR_KEYS = ['forest900', 'forest700', 'cream100', 'ink900', 'stone600', 'lime400'] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
export const FONT_FAMILIES = ['Poppins', 'Fraunces'] as const;

export type Theme = {
	colors: Record<ColorKey, string>;
	fonts: { sans: (typeof FONT_FAMILIES)[number]; serif: (typeof FONT_FAMILIES)[number] };
	radius: { sm: number; md: number };
};

export const DEFAULT_THEME: Theme = {
	colors: {
		forest900: '#12241A',
		forest700: '#1F3B2A',
		cream100: '#F4F1E8',
		ink900: '#1B1F1C',
		stone600: '#5A6159',
		lime400: '#C8F07A'
	},
	fonts: { sans: 'Poppins', serif: 'Fraunces' },
	radius: { sm: 4, md: 12 }
};

/** Every foreground/background pair the UI uses, with its required ratio. */
export const CONTRAST_PAIRS: { fg: ColorKey; bg: ColorKey; min: number; use: string }[] = [
	{ fg: 'ink900', bg: 'cream100', min: 4.5, use: 'body text on page' },
	{ fg: 'stone600', bg: 'cream100', min: 4.5, use: 'secondary text on page' },
	{ fg: 'forest700', bg: 'cream100', min: 4.5, use: 'headings on page' },
	{ fg: 'cream100', bg: 'forest700', min: 4.5, use: 'text on forest surface' },
	{ fg: 'cream100', bg: 'forest900', min: 4.5, use: 'text on deep surface and scrim' },
	{ fg: 'forest900', bg: 'lime400', min: 4.5, use: 'primary CTA label' },
	{ fg: 'lime400', bg: 'forest900', min: 3, use: 'focus ring and marker on deep surface' },
	{ fg: 'lime400', bg: 'forest700', min: 3, use: 'focus ring and marker on forest surface' }
];

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a 6-digit hex color like #12241A');
const schema = z.object({
	colors: z.object(Object.fromEntries(COLOR_KEYS.map((k) => [k, hex])) as Record<ColorKey, typeof hex>),
	fonts: z.object({ sans: z.enum(FONT_FAMILIES), serif: z.enum(FONT_FAMILIES) }),
	radius: z.object({ sm: z.number().int().min(0).max(16), md: z.number().int().min(0).max(32) })
});

export function validateTheme(input: unknown): { ok: true; theme: Theme } | { ok: false; errors: string[] } {
	const parsed = schema.safeParse(input);
	if (!parsed.success) {
		return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
	}
	const theme = parsed.data as Theme;
	const errors: string[] = [];
	for (const p of CONTRAST_PAIRS) {
		const r = contrastRatio(theme.colors[p.fg], theme.colors[p.bg]);
		if (r < p.min) {
			errors.push(`${p.fg} on ${p.bg} (${p.use}) has contrast ${r.toFixed(2)}, needs ${p.min}`);
		}
	}
	return errors.length ? { ok: false, errors } : { ok: true, theme };
}

const CSS_NAME: Record<ColorKey, string> = {
	forest900: '--forest-900',
	forest700: '--forest-700',
	cream100: '--cream-100',
	ink900: '--ink-900',
	stone600: '--stone-600',
	lime400: '--lime-400'
};

export function themeToCss(theme: Theme): string {
	const colors = COLOR_KEYS.map((k) => `${CSS_NAME[k]}:${theme.colors[k]}`).join(';');
	return `:root{${colors};--r-sm:${theme.radius.sm}px;--r-md:${theme.radius.md}px;--font-latin-sans:'${theme.fonts.sans}';--font-latin-serif:'${theme.fonts.serif}'}`;
}
```

- [ ] **Step 5: Run tests** — `npx vitest run src/lib/theme`. Expected: pass. If a default pair fails by a hair, fix the default color in `DEFAULT_THEME` (and the Global Constraints list) rather than lowering `min`.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: theme tokens with contrast validation" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`

---

### Task 5: Content queries, sections, slug, YouTube, markdown

**Files:**
- Create: `src/lib/slug.ts`, `src/lib/youtube.ts`, `src/lib/server/markdown.ts`, `src/lib/server/sections.ts`, `src/lib/server/content.ts`, `src/lib/server/test-fixtures.ts`
- Test: `src/lib/slug.test.ts`, `src/lib/youtube.test.ts`, `src/lib/server/markdown.test.ts`, `src/lib/server/content.test.ts`, `src/lib/server/sections.test.ts`

**Interfaces:**
- Consumes: `createDb`, schema (Task 2); `pickTranslation`, `Lang` (Task 3).
- Produces:
  - `slugify(input: string, fallback: string): string`
  - `youtubeId(url: string | null | undefined): string | null`
  - `renderMarkdown(md: string | null | undefined): string`
  - `SECTION_KEYS`, `type SectionKey`, `DEFAULT_SECTIONS`, `ensureSections(db)`, `resolveVisibleSections(rows, flags): SectionKey[]`, `NAV_ORDER`, `navItemsFor(visible: SectionKey[]): { key: SectionKey; labelKey: DictKey; path: string }[]` where `path` is relative (`/products`) and callers prefix `/{lang}`
  - `type Localized<B, T> = B & { t: T; usedLang: Lang }`
  - content getters (all take `(db: Db, lang: Lang, ...)`): `getSettings`, `getCollections`, `getProducts(opts?)`, `getProductBySlug`, `getBestSeller`, `getCollectionBySlug`, `getNewsPage(page, perPage)`, `getNewsBySlug` (returns `{ item, prev, next }`), `getTestimonials`, `getAccolades`, `getChrome` (`{ settings, visible, nav }`), `getLandingData`
  - test helper `seedFixture(db)`

- [ ] **Step 1: Write failing tests for the pure helpers**

`src/lib/slug.test.ts`:

```ts
import { expect, it } from 'vitest';
import { slugify } from './slug';

it('slugifies Latin text', () => expect(slugify('Revolutic® BioSpray® Plus!', 'x')).toBe('revolutic-biospray-plus'));
it('removes accents', () => expect(slugify('Café Éclair', 'x')).toBe('cafe-eclair'));
it('uses the fallback for text without Latin letters', () => {
	expect(slugify('金士力佳友与爱邻乐', 'news-7')).toBe('news-7');
	expect(slugify('น้ำท่วม', 'news-8')).toBe('news-8');
	expect(slugify('', 'news-9')).toBe('news-9');
});
it('caps the length', () => expect(slugify('a'.repeat(200), 'x').length).toBeLessThanOrEqual(80));
```

`src/lib/youtube.test.ts`:

```ts
import { expect, it } from 'vitest';
import { youtubeId } from './youtube';

const id = 'dQw4w9WgXcQ';
it.each([
	[`https://www.youtube.com/watch?v=${id}`, id],
	[`https://youtube.com/watch?v=${id}&t=10`, id],
	[`https://youtu.be/${id}`, id],
	[`https://www.youtube.com/embed/${id}`, id],
	[`https://www.youtube.com/shorts/${id}`, id],
	['https://vimeo.com/123456', null],
	['javascript:alert(1)', null],
	['https://evil.com/watch?v=dQw4w9WgXcQ', null],
	['https://www.youtube.com/watch?v=short', null],
	['', null],
	[null, null]
])('%s -> %s', (url, expected) => expect(youtubeId(url as string | null)).toBe(expected));
```

`src/lib/server/markdown.test.ts`:

```ts
import { expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

it('renders markdown', () => expect(renderMarkdown('**hi**')).toContain('<strong>hi</strong>'));
it('strips script tags and event handlers', () => {
	const out = renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(1)>');
	expect(out).not.toContain('<script');
	expect(out).not.toContain('onerror');
});
it('neutralises javascript: links', () => {
	expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('javascript:');
});
it('returns an empty string for null', () => expect(renderMarkdown(null)).toBe(''));
```

- [ ] **Step 2: Run, see them fail** — `npx vitest run src/lib/slug.test.ts src/lib/youtube.test.ts src/lib/server/markdown.test.ts`.

- [ ] **Step 3: Implement the helpers**

`src/lib/slug.ts`:

```ts
export function slugify(input: string, fallback: string): string {
	const s = input
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
		.replace(/-+$/g, '');
	return s || fallback;
}
```

`src/lib/youtube.ts`:

```ts
const ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeId(url: string | null | undefined): string | null {
	if (!url) return null;
	let u: URL;
	try {
		u = new URL(url);
	} catch {
		return null;
	}
	if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
	const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
	let candidate: string | null = null;
	if (host === 'youtu.be') candidate = u.pathname.slice(1).split('/')[0];
	else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
		if (u.pathname === '/watch') candidate = u.searchParams.get('v');
		else {
			const m = u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
			candidate = m?.[1] ?? null;
		}
	}
	return candidate && ID.test(candidate) ? candidate : null;
}
```

`src/lib/server/markdown.ts`:

```ts
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderMarkdown(md: string | null | undefined): string {
	if (!md) return '';
	const html = marked.parse(md, { async: false, gfm: true, breaks: false }) as string;
	return sanitizeHtml(html, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h2', 'h3']),
		allowedAttributes: { a: ['href', 'title', 'rel'], img: ['src', 'alt', 'title'] },
		allowedSchemes: ['http', 'https', 'mailto', 'tel'],
		transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) }
	});
}
```

- [ ] **Step 4: Run helper tests** — expect all pass.

- [ ] **Step 5: Write failing tests for sections and content**

`src/lib/server/sections.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { navItemsFor, resolveVisibleSections, type SectionKey } from './sections';

const rows = [
	{ key: 'hero', position: 0, isEnabled: true },
	{ key: 'best_seller', position: 1, isEnabled: true },
	{ key: 'collections', position: 2, isEnabled: true },
	{ key: 'about', position: 3, isEnabled: false },
	{ key: 'testimonials', position: 4, isEnabled: true },
	{ key: 'accolades', position: 5, isEnabled: true },
	{ key: 'news', position: 6, isEnabled: true },
	{ key: 'newsletter', position: 7, isEnabled: true }
];
const all = (v: boolean) =>
	Object.fromEntries(rows.map((r) => [r.key, v])) as Record<SectionKey, boolean>;

describe('resolveVisibleSections', () => {
	it('keeps position order and drops disabled sections', () => {
		expect(resolveVisibleSections(rows, all(true))).toEqual([
			'hero', 'best_seller', 'collections', 'testimonials', 'accolades', 'news', 'newsletter'
		]);
	});
	it('drops sections without content', () => {
		const flags = { ...all(true), news: false, testimonials: false };
		expect(resolveVisibleSections(rows, flags)).not.toContain('news');
		expect(resolveVisibleSections(rows, flags)).not.toContain('testimonials');
	});
	it('respects a reordered position', () => {
		const re = rows.map((r) => (r.key === 'news' ? { ...r, position: -1 } : r));
		expect(resolveVisibleSections(re, all(true))[0]).toBe('news');
	});
	it('ignores unknown keys', () => {
		expect(resolveVisibleSections([{ key: 'bogus', position: 0, isEnabled: true }], all(true))).toEqual([]);
	});
});

describe('navItemsFor', () => {
	it('lists only visible content sections, in fixed order, with real paths', () => {
		const items = navItemsFor(['hero', 'news', 'collections', 'newsletter']);
		expect(items.map((i) => i.path)).toEqual(['/products', '/news']);
	});
	it('is empty when nothing but hero and newsletter is visible', () => {
		expect(navItemsFor(['hero', 'newsletter'])).toEqual([]);
	});
});
```

`src/lib/server/content.test.ts` (uses the fixture; write the fixture in Step 7):

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import * as c from './content';
import { seedFixture } from './test-fixtures';

let db: Db;
beforeEach(() => {
	db = createDb(':memory:');
	seedFixture(db);
});

describe('products', () => {
	it('returns only published products with a usable translation', () => {
		const list = c.getProducts(db, 'en');
		expect(list.map((p) => p.slug)).toEqual(['biospray', 'green-mix']);
	});
	it('uses the requested language and falls back to English per item', () => {
		const zh = c.getProducts(db, 'zh');
		expect(zh[0].t.name).toBe('生物喷雾');
		expect(zh[0].usedLang).toBe('zh');
		expect(zh[1].t.name).toBe('Green Mix');
		expect(zh[1].usedLang).toBe('en');
	});
	it('skips an item that has no English and no requested translation', () => {
		expect(c.getProducts(db, 'th').map((p) => p.slug)).not.toContain('zh-only');
		expect(c.getProducts(db, 'zh').map((p) => p.slug)).toContain('zh-only');
	});
	it('finds by slug, and returns null for unpublished or missing', () => {
		expect(c.getProductBySlug(db, 'en', 'biospray')?.t.name).toBe('BioSpray');
		expect(c.getProductBySlug(db, 'en', 'draft-product')).toBeNull();
		expect(c.getProductBySlug(db, 'en', 'nope')).toBeNull();
	});
	it('picks the best seller by sort order, ignoring unpublished', () => {
		expect(c.getBestSeller(db, 'en')?.slug).toBe('biospray');
	});
	it('returns null best seller when none is flagged', () => {
		db.update(schemaProducts()).set({ isBestSeller: false }).run();
		expect(c.getBestSeller(db, 'en')).toBeNull();
	});
});

describe('collections', () => {
	it('lists only collections that have a published product', () => {
		expect(c.getCollections(db, 'en').map((x) => x.slug)).toEqual(['revolutic']);
	});
});

describe('news', () => {
	it('lists published news newest first and paginates', () => {
		const p = c.getNewsPage(db, 'en', 1, 1);
		expect(p.total).toBe(2);
		expect(p.pages).toBe(2);
		expect(p.items[0].slug).toBe('news-newer');
		expect(c.getNewsPage(db, 'en', 2, 1).items[0].slug).toBe('news-older');
	});
	it('clamps an out-of-range page', () => {
		expect(c.getNewsPage(db, 'en', 99, 1).items[0].slug).toBe('news-older');
		expect(c.getNewsPage(db, 'en', -3, 1).items[0].slug).toBe('news-newer');
	});
	it('returns prev and next neighbours', () => {
		const r = c.getNewsBySlug(db, 'en', 'news-newer');
		expect(r?.prev).toBeNull();
		expect(r?.next?.slug).toBe('news-older');
	});
	it('hides drafts', () => expect(c.getNewsBySlug(db, 'en', 'news-draft')).toBeNull());
});

describe('landing', () => {
	it('shows all content sections for the fixture', () => {
		const d = c.getLandingData(db, 'en');
		expect(d.visible).toEqual(['hero', 'best_seller', 'collections', 'about', 'testimonials', 'accolades', 'news', 'newsletter']);
	});
	it('with nothing published shows only hero and newsletter and no nav', () => {
		db.update(schemaProducts()).set({ isPublished: false }).run();
		unpublishAll(db);
		const d = c.getLandingData(db, 'en');
		expect(d.visible).toEqual(['hero', 'newsletter']);
		expect(c.getChrome(db, 'en').nav).toEqual([]);
	});
});

import * as s from './db/schema';
function schemaProducts() {
	return s.products;
}
function unpublishAll(d: Db) {
	d.update(s.news).set({ status: 'draft' }).run();
	d.update(s.testimonials).set({ isPublished: false }).run();
	d.update(s.accolades).set({ isPublished: false }).run();
	d.update(s.siteSettingsTranslations).set({ aboutTeaserMd: null, aboutMd: null }).run();
}
```

- [ ] **Step 6: Implement `sections.ts`**

```ts
import { eq } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';
import type { DictKey } from '../i18n';

export const SECTION_KEYS = [
	'hero', 'best_seller', 'collections', 'about', 'testimonials', 'accolades', 'news', 'newsletter'
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export const DEFAULT_SECTIONS = SECTION_KEYS.map((key, position) => ({ key, position, isEnabled: true }));

export function ensureSections(db: Db): void {
	for (const row of DEFAULT_SECTIONS) {
		const exists = db.select().from(s.pageSections).where(eq(s.pageSections.key, row.key)).get();
		if (!exists) db.insert(s.pageSections).values(row).run();
	}
}

export function resolveVisibleSections(
	rows: { key: string; position: number; isEnabled: boolean }[],
	hasContent: Record<SectionKey, boolean>
): SectionKey[] {
	return rows
		.filter((r): r is typeof r & { key: SectionKey } => (SECTION_KEYS as readonly string[]).includes(r.key))
		.filter((r) => r.isEnabled && hasContent[r.key])
		.sort((a, b) => a.position - b.position)
		.map((r) => r.key);
}

export const NAV_ORDER: { key: SectionKey; labelKey: DictKey; path: string }[] = [
	{ key: 'collections', labelKey: 'nav.products', path: '/products' },
	{ key: 'testimonials', labelKey: 'nav.testimonials', path: '/testimonials' },
	{ key: 'accolades', labelKey: 'nav.accolades', path: '/accolades' },
	{ key: 'news', labelKey: 'nav.news', path: '/news' },
	{ key: 'about', labelKey: 'nav.about', path: '/about' }
];

export function navItemsFor(visible: SectionKey[]) {
	return NAV_ORDER.filter((n) => visible.includes(n.key));
}
```

- [ ] **Step 7: Implement `test-fixtures.ts`**

```ts
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
```

- [ ] **Step 8: Implement `content.ts`**

```ts
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';
import { pickTranslation } from '../i18n/translate';
import type { Lang } from '../i18n/config';
import { navItemsFor, resolveVisibleSections, type SectionKey } from './sections';

export type Localized<B, T> = B & { t: T; usedLang: Lang };

function groupBy<T>(rows: T[], key: (r: T) => number): Map<number, T[]> {
	const m = new Map<number, T[]>();
	for (const r of rows) {
		const k = key(r);
		const list = m.get(k);
		if (list) list.push(r);
		else m.set(k, [r]);
	}
	return m;
}

function localize<B extends { id: number }, T extends { lang: string }>(
	bases: B[],
	trs: Map<number, T[]>,
	lang: Lang
): Localized<B, T>[] {
	const out: Localized<B, T>[] = [];
	for (const b of bases) {
		const p = pickTranslation(trs.get(b.id) ?? [], lang);
		if (p.row) out.push({ ...b, t: p.row, usedLang: p.usedLang! });
	}
	return out;
}

// ---------- products ----------
export function getProducts(db: Db, lang: Lang, o: { collectionId?: number; excludeId?: number; limit?: number } = {}) {
	const where = o.collectionId != null
		? and(eq(s.products.isPublished, true), eq(s.products.collectionId, o.collectionId))
		: eq(s.products.isPublished, true);
	const bases = db.select().from(s.products).where(where).orderBy(asc(s.products.sortOrder), asc(s.products.id)).all()
		.filter((p) => p.id !== o.excludeId);
	const trs = groupBy(
		bases.length ? db.select().from(s.productTranslations).where(inArray(s.productTranslations.productId, bases.map((b) => b.id))).all() : [],
		(r) => r.productId
	);
	const list = localize(bases, trs, lang);
	return o.limit ? list.slice(0, o.limit) : list;
}
export type ProductView = ReturnType<typeof getProducts>[number];

export function getProductBySlug(db: Db, lang: Lang, slug: string): ProductView | null {
	return getProducts(db, lang).find((p) => p.slug === slug) ?? null;
}
export function getBestSeller(db: Db, lang: Lang): ProductView | null {
	return getProducts(db, lang).find((p) => p.isBestSeller) ?? null;
}

// ---------- collections ----------
export function getCollections(db: Db, lang: Lang) {
	const products = getProducts(db, lang);
	const bases = db.select().from(s.collections).orderBy(asc(s.collections.sortOrder), asc(s.collections.id)).all()
		.filter((c) => products.some((p) => p.collectionId === c.id));
	const trs = groupBy(
		bases.length ? db.select().from(s.collectionTranslations).where(inArray(s.collectionTranslations.collectionId, bases.map((b) => b.id))).all() : [],
		(r) => r.collectionId
	);
	return localize(bases, trs, lang).map((c) => ({ ...c, productCount: products.filter((p) => p.collectionId === c.id).length }));
}
export function getCollectionBySlug(db: Db, lang: Lang, slug: string) {
	return getCollections(db, lang).find((c) => c.slug === slug) ?? null;
}

// ---------- news ----------
function allNews(db: Db, lang: Lang) {
	const bases = db.select().from(s.news).where(eq(s.news.status, 'published'))
		.orderBy(desc(s.news.eventDate), desc(s.news.id)).all();
	const trs = groupBy(
		bases.length ? db.select().from(s.newsTranslations).where(inArray(s.newsTranslations.newsId, bases.map((b) => b.id))).all() : [],
		(r) => r.newsId
	);
	return localize(bases, trs, lang);
}
export type NewsView = ReturnType<typeof allNews>[number];

export function getNewsPage(db: Db, lang: Lang, page: number, perPage: number) {
	const all = allNews(db, lang);
	const pages = Math.max(1, Math.ceil(all.length / perPage));
	const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
	return { items: all.slice((current - 1) * perPage, current * perPage), total: all.length, pages, page: current };
}
export function getNewsBySlug(db: Db, lang: Lang, slug: string) {
	const all = allNews(db, lang);
	const i = all.findIndex((n) => n.slug === slug);
	if (i < 0) return null;
	return { item: all[i], prev: all[i - 1] ?? null, next: all[i + 1] ?? null };
}

// ---------- testimonials and accolades ----------
export function getTestimonials(db: Db, lang: Lang) {
	const bases = db.select().from(s.testimonials).where(eq(s.testimonials.isPublished, true))
		.orderBy(asc(s.testimonials.sortOrder), asc(s.testimonials.id)).all();
	const trs = groupBy(
		bases.length ? db.select().from(s.testimonialTranslations).where(inArray(s.testimonialTranslations.testimonialId, bases.map((b) => b.id))).all() : [],
		(r) => r.testimonialId
	);
	return localize(bases, trs, lang);
}
export function getAccolades(db: Db, lang: Lang) {
	const bases = db.select().from(s.accolades).where(eq(s.accolades.isPublished, true))
		.orderBy(asc(s.accolades.year), asc(s.accolades.sortOrder), asc(s.accolades.id)).all();
	const trs = groupBy(
		bases.length ? db.select().from(s.accoladeTranslations).where(inArray(s.accoladeTranslations.accoladeId, bases.map((b) => b.id))).all() : [],
		(r) => r.accoladeId
	);
	return localize(bases, trs, lang);
}

// ---------- settings, chrome, landing ----------
export function getSettings(db: Db, lang: Lang) {
	const base = db.select().from(s.siteSettings).where(eq(s.siteSettings.id, 1)).get();
	if (!base) return null;
	const trs = db.select().from(s.siteSettingsTranslations).all();
	const p = pickTranslation(trs, lang);
	return { ...base, t: p.row, usedLang: p.usedLang };
}

function contentFlags(db: Db, lang: Lang, settings: ReturnType<typeof getSettings>) {
	const flags: Record<SectionKey, boolean> = {
		hero: !!settings,
		best_seller: getBestSeller(db, lang) != null,
		collections: getProducts(db, lang).length > 0,
		about: !!settings?.t?.aboutTeaserMd?.trim(),
		testimonials: getTestimonials(db, lang).length > 0,
		accolades: getAccolades(db, lang).length > 0,
		news: getNewsPage(db, lang, 1, 1).total > 0,
		newsletter: true
	};
	return flags;
}

export function getChrome(db: Db, lang: Lang) {
	const settings = getSettings(db, lang);
	const rows = db.select().from(s.pageSections).all();
	const visible = resolveVisibleSections(rows, contentFlags(db, lang, settings));
	return { settings, visible, nav: navItemsFor(visible) };
}

export function getLandingData(db: Db, lang: Lang) {
	const { settings, visible, nav } = getChrome(db, lang);
	return {
		settings, visible, nav,
		bestSeller: getBestSeller(db, lang),
		collections: getCollections(db, lang),
		products: getProducts(db, lang),
		testimonials: getTestimonials(db, lang),
		accolades: getAccolades(db, lang),
		news: getNewsPage(db, lang, 1, 3).items
	};
}
```

- [ ] **Step 9: Run all Task 5 tests** — `npx vitest run src/lib`. Expected: all pass. Fix any Drizzle API mismatch (for example `.get()` vs `.all()` naming) without changing behavior.

- [ ] **Step 10: Commit** — `git add -A && git commit -m "feat: content queries, section resolution, slug, youtube, markdown" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`

---

### Task 6: Auth, rate limiting, hooks, admin login

**Files:**
- Create: `src/lib/server/auth.ts`, `src/lib/server/rate-limit.ts`, `src/hooks.server.ts`, `src/params/lang.ts`, `src/params/entity.ts`, `src/routes/admin/login/+page.server.ts`, `src/routes/admin/login/+page.svelte`, `src/routes/admin/+layout.server.ts`
- Test: `src/lib/server/auth.test.ts`, `src/lib/server/rate-limit.test.ts`, `src/lib/server/lang-redirect.test.ts`

**Interfaces:**
- Consumes: `createDb`, schema; `parseAcceptLanguage`, `isLang`, `htmlLangFor`.
- Produces:
  - `hashPassword(pw: string): Promise<string>`, `verifyPassword(hash: string, pw: string): Promise<boolean>`
  - `createSession(db, userId: number, nowMs?: number): { token: string; expiresAt: number }`
  - `validateSession(db, token: string, nowMs?: number): { id: number; email: string } | null`
  - `deleteSession(db, token: string): void`
  - `createAdminUser(db, email: string, password: string): Promise<void>`
  - `class RateLimiter { constructor(max: number, windowMs: number); isBlocked(key: string, nowMs?: number): boolean; fail(key: string, nowMs?: number): void; reset(key: string): void }`
  - `unsupportedLangRedirect(pathname: string): string | null` (pure, in `src/lib/server/lang-redirect.ts`)
  - `event.locals.user`, `event.locals.lang`

- [ ] **Step 1: Write failing tests**

`src/lib/server/auth.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createDb } from './db';
import { createAdminUser, createSession, deleteSession, hashPassword, validateSession, verifyPassword } from './auth';

describe('passwords', () => {
	it('hashes and verifies', async () => {
		const h = await hashPassword('correct horse battery');
		expect(h).not.toContain('correct horse');
		expect(await verifyPassword(h, 'correct horse battery')).toBe(true);
		expect(await verifyPassword(h, 'wrong')).toBe(false);
	});
});

describe('sessions', () => {
	async function setup() {
		const db = createDb(':memory:');
		await createAdminUser(db, 'a@b.co', 'password-123456');
		return db;
	}
	it('creates and validates a session', async () => {
		const db = await setup();
		const { token } = createSession(db, 1, 1_000_000);
		expect(validateSession(db, token, 1_000_001)?.email).toBe('a@b.co');
	});
	it('stores only a hash of the token', async () => {
		const db = await setup();
		const { token } = createSession(db, 1);
		const rows = db.$client.prepare('select id from sessions').all() as { id: string }[];
		expect(rows[0].id).not.toBe(token);
	});
	it('expires after 7 days', async () => {
		const db = await setup();
		const { token } = createSession(db, 1, 0);
		expect(validateSession(db, token, 7 * 86_400_000 + 1)).toBeNull();
	});
	it('slides the expiry when more than half the time has passed', async () => {
		const db = await setup();
		const { token } = createSession(db, 1, 0);
		expect(validateSession(db, token, 5 * 86_400_000)).not.toBeNull();
		expect(validateSession(db, token, 11 * 86_400_000)).not.toBeNull();
	});
	it('rejects unknown tokens and deleted sessions', async () => {
		const db = await setup();
		expect(validateSession(db, 'nope')).toBeNull();
		const { token } = createSession(db, 1);
		deleteSession(db, token);
		expect(validateSession(db, token)).toBeNull();
	});
});
```

`src/lib/server/rate-limit.test.ts`:

```ts
import { expect, it } from 'vitest';
import { RateLimiter } from './rate-limit';

it('blocks after max failures within the window and recovers after it', () => {
	const rl = new RateLimiter(5, 900_000);
	for (let i = 0; i < 5; i++) {
		expect(rl.isBlocked('ip', i)).toBe(false);
		rl.fail('ip', i);
	}
	expect(rl.isBlocked('ip', 10)).toBe(true);
	expect(rl.isBlocked('other', 10)).toBe(false);
	expect(rl.isBlocked('ip', 900_100)).toBe(false);
});
it('reset clears failures', () => {
	const rl = new RateLimiter(2, 1000);
	rl.fail('ip', 0);
	rl.fail('ip', 1);
	rl.reset('ip');
	expect(rl.isBlocked('ip', 2)).toBe(false);
});
```

`src/lib/server/lang-redirect.test.ts`:

```ts
import { expect, it } from 'vitest';
import { unsupportedLangRedirect } from './lang-redirect';

it.each([
	['/xx/products', '/en/products'],
	['/fr', '/en'],
	['/pt-br/news/a', '/en/news/a'],
	['/en/products', null],
	['/zh-tw/news', null],
	['/admin/login', null],
	['/uploads/a.jpg', null],
	['/', null],
	['/products', null],
	['/api/subscribe', null],
	['/_app/immutable/x.js', null]
])('%s -> %s', (path, expected) => expect(unsupportedLangRedirect(path)).toBe(expected));
```

- [ ] **Step 2: Run, see them fail.**

- [ ] **Step 3: Implement `rate-limit.ts` and `lang-redirect.ts`**

`rate-limit.ts`:

```ts
export class RateLimiter {
	private hits = new Map<string, number[]>();
	constructor(private max: number, private windowMs: number) {}
	private recent(key: string, now: number): number[] {
		const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
		this.hits.set(key, list);
		return list;
	}
	isBlocked(key: string, now = Date.now()): boolean {
		return this.recent(key, now).length >= this.max;
	}
	fail(key: string, now = Date.now()): void {
		this.recent(key, now).push(now);
	}
	reset(key: string): void {
		this.hits.delete(key);
	}
}
```

`lang-redirect.ts`:

```ts
import { isLang } from '../i18n/config';

const RESERVED = new Set(['admin', 'uploads', 'api', '_app', 'favicon.ico', 'robots.txt']);
const LOOKS_LIKE_LANG = /^[a-z]{2}(-[a-z]{2,4})?$/i;

export function unsupportedLangRedirect(pathname: string): string | null {
	const [, first, ...rest] = pathname.split('/');
	if (!first || RESERVED.has(first) || isLang(first.toLowerCase())) return null;
	if (!LOOKS_LIKE_LANG.test(first)) return null;
	return `/en${rest.length ? '/' + rest.join('/') : ''}`;
}
```

Note `/products` (no language prefix) is not two letters, so it is not redirected here; Task 9 adds a language-less fallback route that redirects `/products` to `/{lang}/products`.

- [ ] **Step 4: Implement `auth.ts`**

```ts
import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';

const DAY_MS = 86_400_000;
export const SESSION_DAYS = 7;
const sha = (token: string) => createHash('sha256').update(token).digest('hex');

export const hashPassword = (pw: string) => hash(pw);
export const verifyPassword = (h: string, pw: string) => verify(h, pw).catch(() => false);

export async function createAdminUser(db: Db, email: string, password: string): Promise<void> {
	const passwordHash = await hashPassword(password);
	db.insert(s.adminUsers).values({ email: email.toLowerCase(), passwordHash })
		.onConflictDoUpdate({ target: s.adminUsers.email, set: { passwordHash } }).run();
}

export function createSession(db: Db, userId: number, nowMs = Date.now()) {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = nowMs + SESSION_DAYS * DAY_MS;
	db.insert(s.sessions).values({ id: sha(token), userId, expiresAt }).run();
	return { token, expiresAt };
}

export function validateSession(db: Db, token: string, nowMs = Date.now()) {
	const id = sha(token);
	const row = db.select({ session: s.sessions, user: s.adminUsers }).from(s.sessions)
		.innerJoin(s.adminUsers, eq(s.sessions.userId, s.adminUsers.id))
		.where(eq(s.sessions.id, id)).get();
	if (!row) return null;
	if (row.session.expiresAt <= nowMs) {
		db.delete(s.sessions).where(eq(s.sessions.id, id)).run();
		return null;
	}
	if (row.session.expiresAt - nowMs < (SESSION_DAYS * DAY_MS) / 2) {
		db.update(s.sessions).set({ expiresAt: nowMs + SESSION_DAYS * DAY_MS }).where(eq(s.sessions.id, id)).run();
	}
	return { id: row.user.id, email: row.user.email };
}

export function deleteSession(db: Db, token: string): void {
	db.delete(s.sessions).where(eq(s.sessions.id, sha(token))).run();
}
```

- [ ] **Step 5: Run the tests** — `npx vitest run src/lib/server`. Expected: pass.

- [ ] **Step 6: Write `hooks.server.ts` and param matchers**

`src/params/lang.ts`:

```ts
import { isLang } from '../lib/i18n/config';
export const match = (param: string) => isLang(param);
```

`src/params/entity.ts`:

```ts
export const match = (param: string) =>
	['products', 'collections', 'news', 'testimonials', 'accolades'].includes(param);
```

`src/hooks.server.ts`:

```ts
import { redirect, type Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { db } from '$lib/server/db/instance';
import { validateSession } from '$lib/server/auth';
import { unsupportedLangRedirect } from '$lib/server/lang-redirect';
import { htmlLangFor, isLang, type Lang } from '$lib/i18n/config';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	const fix = unsupportedLangRedirect(path);
	if (fix) throw redirect(308, fix + event.url.search);

	const token = event.cookies.get('session');
	event.locals.user = token ? validateSession(db, token) : null;

	if (path.startsWith('/admin') && path !== '/admin/login' && !event.locals.user) {
		throw redirect(303, '/admin/login');
	}

	const first = path.split('/')[1]?.toLowerCase() ?? '';
	const lang: Lang = isLang(first) ? first : 'en';
	event.locals.lang = lang;

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', htmlLangFor(lang))
	});
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	if (!dev) response.headers.set('Strict-Transport-Security', 'max-age=31536000');
	return response;
};
```

- [ ] **Step 7: Write the login route**

`src/routes/admin/login/+page.server.ts`:

```ts
import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { createSession, SESSION_DAYS, verifyPassword } from '$lib/server/auth';
import { RateLimiter } from '$lib/server/rate-limit';
import type { Actions, PageServerLoad } from './$types';

const limiter = new RateLimiter(5, 15 * 60_000);
// Valid argon2 hash of a random string, used so unknown emails cost the same time as known ones.
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$Q2wTn5q5k0yq8mUqS1m7yq1m3mYH4m5Z0oW1m0qzQhQ';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) throw redirect(303, '/admin');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const key = getClientAddress();
		if (limiter.isBlocked(key)) return fail(429, { error: 'Too many attempts. Try again in 15 minutes.' });
		const fd = await request.formData();
		const email = String(fd.get('email') ?? '').trim().toLowerCase();
		const password = String(fd.get('password') ?? '');
		const user = db.select().from(s.adminUsers).where(eq(s.adminUsers.email, email)).get();
		const ok = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, password);
		if (!user || !ok) {
			limiter.fail(key);
			return fail(400, { error: 'Email or password is incorrect.', email });
		}
		limiter.reset(key);
		const { token } = createSession(db, user.id);
		cookies.set('session', token, {
			path: '/', httpOnly: true, sameSite: 'lax', secure: !dev, maxAge: SESSION_DAYS * 86_400
		});
		throw redirect(303, '/admin');
	}
};
```

`src/routes/admin/login/+page.svelte`:

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Admin sign in</title></svelte:head>

<main class="mx-auto flex min-h-[100svh] max-w-sm flex-col justify-center px-4">
	<h1 class="font-serif text-3xl text-forest-700">Admin sign in</h1>
	<form method="post" class="mt-8 space-y-5"
		use:enhance={() => { busy = true; return async ({ update }) => { await update(); busy = false; }; }}>
		<label class="block text-sm">Email
			<input name="email" type="email" required autocomplete="username" value={form?.email ?? ''}
				class="mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2" />
		</label>
		<label class="block text-sm">Password
			<input name="password" type="password" required autocomplete="current-password"
				class="mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2" />
		</label>
		{#if form?.error}<p role="alert" class="text-sm text-red-800">{form.error}</p>{/if}
		<button disabled={busy} class="w-full rounded-sm bg-forest-700 px-4 py-3 text-cream-100 disabled:opacity-60">
			{busy ? 'Signing in' : 'Sign in'}
		</button>
	</form>
</main>
```

`src/routes/admin/+layout.server.ts`:

```ts
import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = ({ locals }) => ({ user: locals.user });
```

Note: `DUMMY_HASH` must be a syntactically valid argon2 hash or `verify` throws and returns false fast (the `.catch(() => false)` in `verifyPassword` keeps the flow correct, only the timing parity is affected). In Step 8 generate a real one and paste it in.

- [ ] **Step 8: Replace the dummy hash with a real one**

Run: `node -e "import('@node-rs/argon2').then(async m=>console.log(await m.hash('dummy-not-a-real-password')))"`. Paste the output over `DUMMY_HASH`.

- [ ] **Step 9: Verify the build and commit**

Run `npm run build`. Expected: succeeds (Tailwind classes such as `bg-forest-700` are added in Task 9; unknown utilities do not fail the build). Then:

```bash
git add -A && git commit -m "feat: admin auth, sessions, rate limit, hooks, language redirects" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Scraper

**Files:**
- Create: `scripts/seed-types.ts`, `scripts/scrape-lib.ts`, `scripts/scrape.ts`, `seed/curated/testimonials.json`
- Test: `scripts/scrape-lib.test.ts`
- Output (committed): `seed/data.json`, `seed/images/*`, `seed/REPORT.md`

**Source facts (verified in the browser on 2026-10-11):**
- Translated UI/news/about text: `https://www.nutric.com/assets/i18n/{en,ms,id,zh,zh_tw,th}.json`. News keys: `NEWS.NEWS{n}` (title), `NEWS{n}SHORTDESC`, `NEWS{n}LONGDESC{k}` (paragraphs), n = 1..4. About keys under `ABOUTUS`: `WEARENUTRIC`, `NUTRIC-1..5`, `OURMOTTO`, `SLOGAN-1..4`, `OURMISSION`, `MISSION-1`, `OURVISION`, `VISION-1`, `OURHISTORY`, `HISTORY-1..4`, `OUROFFICES`, `OFFICE-1..3`. No date keys.
- News cards on `/news`: `mat-card` with `img.mat-card-image[src]`, `.news-title`, `.date-label` (for example `3rd Nov 2017`); card order = NEWS1..NEWS4 by matching English title.
- Language is `localStorage.lang` (`en`, `ms`, `id`, `zh`, `zh_tw`, `th`).
- `/products`: 12 blocks. Each block's container (the `mat-tab-group`'s parent `div`) has `h3` (name), `p.short-desc` (tagline), `img[src*="product-package"]`, a `mat-tab-group` whose first tab (Description) is rendered HTML (`p`, `<b>Benefits:</b>`, `ul li`) and whose second tab (FAQs) renders `mat-expansion-panel` with `mat-panel-title p` (question) and `.mat-expansion-panel-body` (answer) after the tab is clicked. Regulatory text is the container's remaining text after removing the heading, tagline, images, and tab group.
- Collections are the three series pages `/revolutic`, `/vitanetic`, `/skinetique` with banners `assets/images/{name}-banner.png`. A product belongs to the collection whose brand name starts its English name (`Revolutic`, `Vitanetic`, `Skinetique`).
- Hero video: `/assets/home.mp4`. Logo: `/assets/images/NUTRIC_Logo.png`. Socials: facebook.com/nutric.corporate, instagram.com/nutric.official, youtube.com/c/nutricofficial.
- Accolades: images on `/accolades` (no text).

**Interfaces:**
- Produces: `SeedData` (below) written to `seed/data.json`. Image fields hold a **file name** inside `seed/images/`.

- [ ] **Step 1: Write `scripts/seed-types.ts`**

```ts
export type SeedLang = 'en' | 'ms' | 'id' | 'zh' | 'zh-tw' | 'th';
export const SEED_LANGS: SeedLang[] = ['en', 'ms', 'id', 'zh', 'zh-tw', 'th'];
export type Tr<T> = Partial<Record<SeedLang, T>>;

export interface SeedData {
	generatedAt: string;
	settings: {
		brandName: string;
		logoImage: string | null;
		heroMedia: string | null;
		heroMediaType: 'image' | 'video';
		heroProductImage: string | null;
		contactEmail: string | null;
		contactPhone: string | null;
		whatsappUrl: string | null;
		socialLinks: { platform: string; url: string }[];
		t: Tr<{
			tagline: string | null; headlineLine1: string | null; headlineLine2: string | null;
			subheadline: string | null; ctaLabel: string | null; heroBadgeText: string | null;
			aboutTeaserMd: string | null; aboutMd: string | null; aboutImageAlt: string | null; footerNote: string | null;
		}>;
	};
	collections: {
		slug: string; bannerImage: string | null; sortOrder: number;
		t: Tr<{ name: string; tagline: string | null; description: string | null; bannerAlt: string | null }>;
	}[];
	products: {
		slug: string; collectionSlug: string | null; mainImage: string | null; gallery: string[];
		isBestSeller: boolean; sortOrder: number;
		t: Tr<{
			name: string; shortDescription: string | null; descriptionMd: string | null; benefits: string[];
			ingredientsMd: string | null; howToUseMd: string | null; faqs: { q: string; a: string }[];
			regulatoryText: string | null; imageAlt: string | null;
		}>;
	}[];
	news: {
		slug: string; coverImage: string | null; eventDate: string | null; location: string | null;
		t: Tr<{ title: string; excerpt: string | null; bodyMd: string | null; coverAlt: string | null }>;
	}[];
	testimonials: {
		personName: string | null; role: string | null; youtubeUrl: string | null; sortOrder: number;
		t: Tr<{ title: string; quote: string | null }>;
	}[];
	accolades: {
		image: string; year: number | null; issuer: string | null; sortOrder: number;
		t: Tr<{ title: string; description: string | null; imageAlt: string | null }>;
	}[];
}
```

- [ ] **Step 2: Write failing tests for the pure parsing helpers**

`scripts/scrape-lib.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
	aboutToMarkdown, collectionSlugFor, newsBodyFromI18n, parseNewsDate, regulatoryExpiry, faqsFromPairs, splitBenefits
} from './scrape-lib';

describe('parseNewsDate', () => {
	it.each([
		['3rd Nov 2017', '2017-11-03'],
		['16th Jan 2017', '2017-01-16'],
		['1st Feb 2016', '2016-02-01'],
		['22nd Dec 2015', '2015-12-22'],
		['garbage', null]
	])('%s -> %s', (input, expected) => expect(parseNewsDate(input)).toBe(expected));
});

describe('newsBodyFromI18n', () => {
	const news = { NEWS1: 'T', NEWS1SHORTDESC: 'S', NEWS1LONGDESC1: 'P1', NEWS1LONGDESC2: 'P2', NEWS2: 'T2' };
	it('joins long descriptions in order as markdown paragraphs', () => {
		expect(newsBodyFromI18n(news, 1)).toEqual({ title: 'T', excerpt: 'S', bodyMd: 'P1\n\nP2' });
	});
	it('returns null body when no long description exists', () => {
		expect(newsBodyFromI18n(news, 2)).toEqual({ title: 'T2', excerpt: null, bodyMd: null });
	});
	it('returns null for a missing item', () => expect(newsBodyFromI18n(news, 9)).toBeNull());
});

describe('collectionSlugFor', () => {
	it('matches brand prefixes', () => {
		expect(collectionSlugFor('Revolutic® BioSpray®')).toBe('revolutic');
		expect(collectionSlugFor('Vitanetic® Green Mix')).toBe('vitanetic');
		expect(collectionSlugFor('Skinetique® Nanobelle')).toBe('skinetique');
		expect(collectionSlugFor('Unknown')).toBeNull();
	});
});

describe('regulatoryExpiry', () => {
	it('finds a dd/mm/yyyy date in the text', () => {
		expect(regulatoryExpiry('MAL1\nAdvertisement Expiry Date: 31/12/2025')).toBe('2025-12-31');
	});
	it('returns null when absent', () => expect(regulatoryExpiry('MAL1')).toBeNull());
});

describe('faqsFromPairs', () => {
	it('drops pairs with an empty question or answer and trims', () => {
		expect(faqsFromPairs([[' Q1 ', ' A1 '], ['', 'x'], ['Q2', '']])).toEqual([{ q: 'Q1', a: 'A1' }]);
	});
});

describe('splitBenefits', () => {
	it('extracts list items from description HTML', () => {
		const html = '<p>Intro</p><p><b>Benefits:</b></p><ul><li>One</li><li> Two </li></ul>';
		expect(splitBenefits(html)).toEqual({ descriptionHtml: '<p>Intro</p>', benefits: ['One', 'Two'] });
	});
	it('returns the html untouched when there is no list', () => {
		expect(splitBenefits('<p>Only</p>')).toEqual({ descriptionHtml: '<p>Only</p>', benefits: [] });
	});
});

describe('aboutToMarkdown', () => {
	it('builds sections from the ABOUTUS keys that exist', () => {
		const md = aboutToMarkdown({
			'NUTRIC-1': 'Intro 1', 'NUTRIC-2': 'Intro 2', OURMISSION: 'Our Mission', 'MISSION-1': 'Mission text'
		});
		expect(md).toContain('Intro 1');
		expect(md).toContain('## Our Mission\n\nMission text');
	});
	it('returns null for empty input', () => expect(aboutToMarkdown({})).toBeNull());
});
```

- [ ] **Step 3: Run, see them fail** — `npx vitest run scripts`.

- [ ] **Step 4: Implement `scripts/scrape-lib.ts`**

```ts
const MONTHS: Record<string, string> = {
	jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
	jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

export function parseNewsDate(text: string): string | null {
	const m = text.trim().match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
	if (!m) return null;
	const month = MONTHS[m[2].toLowerCase()];
	return month ? `${m[3]}-${month}-${m[1].padStart(2, '0')}` : null;
}

export function newsBodyFromI18n(news: Record<string, string>, n: number) {
	const title = news[`NEWS${n}`];
	if (!title) return null;
	const paragraphs: string[] = [];
	for (let k = 1; news[`NEWS${n}LONGDESC${k}`] !== undefined; k++) paragraphs.push(news[`NEWS${n}LONGDESC${k}`].trim());
	return {
		title,
		excerpt: news[`NEWS${n}SHORTDESC`] ?? null,
		bodyMd: paragraphs.length ? paragraphs.join('\n\n') : null
	};
}

export function collectionSlugFor(productName: string): string | null {
	const n = productName.toLowerCase();
	for (const brand of ['revolutic', 'vitanetic', 'skinetique']) if (n.startsWith(brand)) return brand;
	return null;
}

export function regulatoryExpiry(text: string): string | null {
	const m = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
	return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}

export function faqsFromPairs(pairs: [string, string][]): { q: string; a: string }[] {
	return pairs
		.map(([q, a]) => ({ q: q.trim(), a: a.trim() }))
		.filter((x) => x.q && x.a);
}

export function splitBenefits(html: string): { descriptionHtml: string; benefits: string[] } {
	const ul = html.match(/<ul>([\s\S]*?)<\/ul>/);
	if (!ul) return { descriptionHtml: html.trim(), benefits: [] };
	const benefits = [...ul[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
	const descriptionHtml = html
		.replace(/<p>\s*<b>[^<]*<\/b>\s*<\/p>/, '')
		.replace(/<ul>[\s\S]*?<\/ul>/, '')
		.trim();
	return { descriptionHtml, benefits };
}

export function aboutToMarkdown(about: Record<string, string>): string | null {
	const parts: string[] = [];
	const intro = ['NUTRIC-1', 'NUTRIC-2'].map((k) => about[k]).filter(Boolean);
	if (intro.length) parts.push(intro.join('\n\n'));
	const sections: [string, string[]][] = [
		['OURMOTTO', ['SLOGAN-1', 'SLOGAN-2', 'SLOGAN-3', 'SLOGAN-4']],
		['OURMISSION', ['MISSION-1']],
		['OURVISION', ['VISION-1']],
		['OURHISTORY', ['HISTORY-1', 'HISTORY-2', 'HISTORY-3', 'HISTORY-4']],
		['OUROFFICES', ['OFFICE-1', 'OFFICE-2', 'OFFICE-3']]
	];
	for (const [heading, keys] of sections) {
		const body = keys.map((k) => about[k]).filter(Boolean);
		if (about[heading] && body.length) parts.push(`## ${about[heading]}\n\n${body.join('\n\n')}`);
	}
	return parts.length ? parts.join('\n\n') : null;
}
```

- [ ] **Step 5: Run the helper tests** — expect pass. (`splitBenefits` removes the "Benefits:" heading paragraph because the UI already renders its own translated "Benefits" heading.)

- [ ] **Step 6: Write `scripts/scrape.ts`**

```ts
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
		await group.locator('.mat-tab-label').nth(1).click().catch(() => null);
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
	const browser = await chromium.launch();
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
		accolades.push({ image: f, year: null, issuer: null, sortOrder: i, t: { en: { title: `Accolade ${i + 1}`, description: null, imageAlt: `Accolade ${i + 1}` } } });
	}
	if (accolades.length) note(`accolades: ${accolades.length} images found; titles, years and issuers are NOT on the source site, fill them in the admin`);
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
			aboutTeaserMd: about['NUTRIC-1'] ?? null, aboutMd, aboutImageAlt: null, footerNote: null
		};
	}
	// Hero copy from the source home page (English), then the translated product taglines per language.
	await openIn(page, '/', 'en');
	const homeLine = (await page.locator('body').innerText()).split('\n').map((x) => x.trim()).find((x) => /regenerative healthcare/i.test(x));
	for (const l of langs) {
		const p = productsByLang[l]?.[0];
		settingsT[l]!.subheadline = l === 'en' ? (homeLine ?? p?.tagline ?? null) : (p?.tagline ?? null);
		settingsT[l]!.headlineLine1 = null;
		settingsT[l]!.headlineLine2 = null;
	}
	note('settings: hero headline lines are NOT on the source site as two separate lines; set them in the admin (Settings > Hero)');
	note('settings: contact email/phone/WhatsApp not collected; add them in the admin to enable the contact buttons');

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
		.replace(/<\/p>\s*<p>/g, '\n\n')
		.replace(/<b>(.*?)<\/b>|<strong>(.*?)<\/strong>/g, (_, a, b) => `**${a ?? b}**`)
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
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
```

- [ ] **Step 7: Curate testimonial videos (human-judgement step, no invented content)**

Create `seed/curated/testimonials.json` as `[]`. Then open `https://www.youtube.com/c/nutricofficial/videos` in the browser tool and note videos that are genuine customer or user testimonials. For each, add an entry with the real watch URL and the video's real title:

```json
[
	{ "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID_FROM_CHANNEL", "title": "Exact video title as shown on YouTube" }
]
```

Add `personName`, `role`, `quote` only if the video page or description states them. If the channel has no testimonial videos, leave `[]` and tell the user (the section stays hidden by design). Verify each ID with `youtubeId()` from `src/lib/youtube.ts` before saving.

- [ ] **Step 8: Run the scraper and review the output**

```bash
npm run scrape
```

Expected: prints product counts per language, writes `seed/data.json`, `seed/REPORT.md`, files in `seed/images/`. Open `seed/REPORT.md`. If product counts differ per language, or FAQs are empty, adjust the selectors in `readProducts` (the DOM facts are listed above) and re-run. Spot-check `seed/data.json`: product 1 name `Revolutic® BioSpray®`, the Malay tagline starts `Regenerasi penjagaan kesihatan`, news has 4 items with ISO dates, no `—` characters in text the scraper authored (source text is stored verbatim, see spec Q1).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: scraper for nutric.com content, seed data and report" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Seed script

**Files:**
- Create: `scripts/seed.ts`
- Test: `scripts/seed.test.ts`

**Interfaces:**
- Consumes: `SeedData` (Task 7), `createDb`, schema, `createAdminUser`, `ensureSections`, `youtubeId`.
- Produces: `loadSeed(db: Db, data: SeedData, opts?: { copyImagesTo?: string; imagesFrom?: string }): void` (exported for tests) and the CLI `npm run seed [-- --db <path>]`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createDb } from '../src/lib/server/db';
import * as s from '../src/lib/server/db/schema';
import { getBestSeller, getChrome, getProducts } from '../src/lib/server/content';
import { loadSeed } from './seed';
import type { SeedData } from './seed-types';

const data: SeedData = {
	generatedAt: 'x',
	settings: {
		brandName: 'B', logoImage: 'logo.png', heroMedia: null, heroMediaType: 'image', heroProductImage: null,
		contactEmail: null, contactPhone: null, whatsappUrl: null, socialLinks: [],
		t: { en: { tagline: null, headlineLine1: 'A', headlineLine2: 'B', subheadline: null, ctaLabel: null, heroBadgeText: null, aboutTeaserMd: 'About', aboutMd: null, aboutImageAlt: null, footerNote: null } }
	},
	collections: [{ slug: 'c', bannerImage: null, sortOrder: 0, t: { en: { name: 'C', tagline: null, description: null, bannerAlt: null } } }],
	products: [
		{ slug: 'p1', collectionSlug: 'c', mainImage: 'a.png', gallery: ['a.png'], isBestSeller: true, sortOrder: 0,
			t: { en: { name: 'P1', shortDescription: null, descriptionMd: null, benefits: ['x'], ingredientsMd: null, howToUseMd: null, faqs: [], regulatoryText: null, imageAlt: null } } }
	],
	news: [{ slug: 'n1', coverImage: null, eventDate: '2017-01-01', location: null, t: { en: { title: 'N', excerpt: null, bodyMd: null, coverAlt: null } } }],
	testimonials: [{ personName: null, role: null, youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ', sortOrder: 0, t: { en: { title: 'V', quote: null } } }],
	accolades: [{ image: 'acc.jpg', year: null, issuer: null, sortOrder: 0, t: { en: { title: 'Acc', description: null, imageAlt: null } } }]
};

describe('loadSeed', () => {
	it('inserts content that the content queries can read', () => {
		const db = createDb(':memory:');
		loadSeed(db, data);
		expect(getProducts(db, 'en')).toHaveLength(1);
		expect(getBestSeller(db, 'en')?.slug).toBe('p1');
		expect(getChrome(db, 'en').visible).toEqual(['hero', 'best_seller', 'collections', 'about', 'testimonials', 'accolades', 'news', 'newsletter']);
	});
	it('rewrites image file names to upload URLs', () => {
		const db = createDb(':memory:');
		loadSeed(db, data);
		expect(db.select().from(s.products).get()?.mainImage).toBe('/uploads/seed/a.png');
	});
	it('is repeatable', () => {
		const db = createDb(':memory:');
		loadSeed(db, data);
		loadSeed(db, data);
		expect(db.select().from(s.products).all()).toHaveLength(1);
	});
	it('skips testimonials whose URL is not a YouTube video', () => {
		const db = createDb(':memory:');
		loadSeed(db, { ...data, testimonials: [{ ...data.testimonials[0], youtubeUrl: 'https://evil.example/x' }] });
		expect(db.select().from(s.testimonials).all()).toHaveLength(0);
	});
});
```

- [ ] **Step 2: Run, see it fail.**

- [ ] **Step 3: Implement `scripts/seed.ts`**

```ts
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
				personName: tm.personName, role: tm.role, youtubeUrl: tm.youtubeUrl, isPublished: true, sortOrder: tm.sortOrder
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
```

Note: `tsx` does not load `.env`; run `node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/seed.ts` by changing the package script to `"seed": "tsx --env-file=.env scripts/seed.ts"` (Node 24 supports `--env-file` through tsx). Update `package.json` accordingly in this step.

- [ ] **Step 4: Run tests, then run the real seed**

```bash
npx vitest run scripts
npm run seed
```

Expected: tests pass; seed prints `Seeded data/nutric.db; ...`. Verify: `node -e "const D=require('better-sqlite3');const d=new D('data/nutric.db');console.log(d.prepare('select count(*) c from products').get(), d.prepare('select count(*) c from news').get())"` shows 12 products and 4 news (adjust if the scraper found different counts).

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: seed script" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`

### Task 9: Site shell (styles, layouts, navbar, footer, uploads route)

**Files:**
- Create: `src/app.css`, `src/lib/i18n/context.ts`, `src/lib/format.ts`, `src/lib/server/upload.ts` (path part), `src/lib/components/ui/{Img.svelte,Dialog.svelte,reveal.ts}`, `src/lib/components/site/{Navbar,LanguageSwitcher,Footer}.svelte`, `src/routes/+layout.server.ts`, `src/routes/+layout.svelte`, `src/routes/+page.server.ts`, `src/routes/+error.svelte`, `src/routes/[...rest]/+page.server.ts`, `src/routes/uploads/[...path]/+server.ts`, `src/routes/[lang=lang]/+layout.server.ts`, `src/routes/[lang=lang]/+layout.svelte`, `src/routes/[lang=lang]/+error.svelte`, `src/routes/[lang=lang]/+page.svelte` (placeholder until Task 11)
- Test: `src/lib/format.test.ts`, `src/lib/server/upload.test.ts`

**Interfaces:**
- Consumes: `getChrome`, `getSettings` (Task 5), `themeToCss` (Task 4), `t`, `LANGUAGES` (Task 3).
- Produces:
  - `provideT(getLang: () => Lang): TFn` and `useT(): TFn` where `TFn = (key: DictKey, vars?: Record<string, string | number>) => string`
  - `formatDate(iso: string | null, lang: Lang): string`
  - `resolveUploadPath(root: string, rel: string): string | null`
  - `reveal(node: HTMLElement)` Svelte action
  - Layout data from `[lang=lang]/+layout.server.ts`: `{ lang, settings, nav, visible, languages, contact: string | null, newsletterEnabled: boolean }`
  - `Img` props `{ src: string | null; alt: string; class?: string; width?: number; height?: number; loading?: 'lazy' | 'eager' }`
  - `Dialog` props `{ open: boolean (bindable); label: string; children: Snippet }`

- [ ] **Step 1: Confirm the font packages**

Run `npm ls @fontsource/fraunces @fontsource/poppins`. Expected: both listed. (`@fontsource/fraunces` registers the family name `Fraunces`, which the theme tokens use; the variable-font package would register `Fraunces Variable` and break the stack.)

- [ ] **Step 2: Write failing tests**

`src/lib/format.test.ts`:

```ts
import { expect, it } from 'vitest';
import { formatDate } from './format';

it('formats an ISO date in the language', () => {
	expect(formatDate('2017-11-03', 'en')).toBe('November 3, 2017');
	expect(formatDate('2017-11-03', 'id')).toContain('2017');
});
it('returns an empty string for null or invalid input', () => {
	expect(formatDate(null, 'en')).toBe('');
	expect(formatDate('not-a-date', 'en')).toBe('');
});
```

`src/lib/server/upload.test.ts`:

```ts
import { sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveUploadPath } from './upload';

describe('resolveUploadPath', () => {
	it('resolves a normal relative path inside the root', () => {
		const p = resolveUploadPath('/data/uploads', 'news/a.jpg');
		expect(p?.endsWith(`news${sep}a.jpg`)).toBe(true);
	});
	it.each(['../secret.txt', '..%2f..%2fetc', 'a/../../b', '/etc/passwd', 'a\0b', 'C:\\Windows\\win.ini'])(
		'rejects %s',
		(rel) => expect(resolveUploadPath('/data/uploads', rel)).toBeNull()
	);
	it('rejects an empty path', () => expect(resolveUploadPath('/data/uploads', '')).toBeNull());
});
```

- [ ] **Step 3: Run, see them fail** — `npx vitest run src/lib/format.test.ts src/lib/server/upload.test.ts`.

- [ ] **Step 4: Implement `format.ts` and the path half of `upload.ts`**

`src/lib/format.ts`:

```ts
import { htmlLangFor, type Lang } from './i18n/config';

export function formatDate(iso: string | null, lang: Lang): string {
	if (!iso) return '';
	const d = new Date(`${iso}T00:00:00Z`);
	if (Number.isNaN(d.getTime())) return '';
	return new Intl.DateTimeFormat(htmlLangFor(lang), { dateStyle: 'long', timeZone: 'UTC' }).format(d);
}
```

`src/lib/server/upload.ts` (Task 13 adds `saveUpload` to this file):

```ts
import { isAbsolute, resolve, sep } from 'node:path';

export function resolveUploadPath(root: string, rel: string): string | null {
	if (!rel || rel.includes('\0') || isAbsolute(rel) || /^[a-zA-Z]:/.test(rel) || rel.includes('%')) return null;
	const base = resolve(root);
	const full = resolve(base, rel);
	return full.startsWith(base + sep) ? full : null;
}
```

- [ ] **Step 5: Run the tests** — expect pass.

- [ ] **Step 6: Write `src/app.css`**

```css
@import 'tailwindcss';
@import '@fontsource/poppins/400.css';
@import '@fontsource/poppins/500.css';
@import '@fontsource/poppins/600.css';
@import '@fontsource/fraunces/500.css';
@import '@fontsource/noto-sans-sc/400.css';
@import '@fontsource/noto-sans-sc/600.css';
@import '@fontsource/noto-sans-tc/400.css';
@import '@fontsource/noto-sans-tc/600.css';
@import '@fontsource/noto-sans-thai/400.css';
@import '@fontsource/noto-sans-thai/600.css';
@import '@fontsource/noto-serif-sc/500.css';
@import '@fontsource/noto-serif-tc/500.css';
@import '@fontsource/noto-serif-thai/500.css';

@theme inline {
	--color-forest-900: var(--forest-900);
	--color-forest-700: var(--forest-700);
	--color-cream-100: var(--cream-100);
	--color-ink-900: var(--ink-900);
	--color-stone-600: var(--stone-600);
	--color-lime-400: var(--lime-400);
	--radius-sm: var(--r-sm);
	--radius-md: var(--r-md);
	--font-sans: var(--font-sans-stack);
	--font-serif: var(--font-serif-stack);
}

:root {
	--font-sans-stack: var(--font-latin-sans), system-ui, sans-serif;
	--font-serif-stack: var(--font-latin-serif), Georgia, serif;
}
:lang(zh) {
	--font-sans-stack: var(--font-latin-sans), 'Noto Sans SC', system-ui, sans-serif;
	--font-serif-stack: var(--font-latin-serif), 'Noto Serif SC', serif;
	line-break: strict;
}
:lang(zh-TW) {
	--font-sans-stack: var(--font-latin-sans), 'Noto Sans TC', system-ui, sans-serif;
	--font-serif-stack: var(--font-latin-serif), 'Noto Serif TC', serif;
	line-break: strict;
}
:lang(th) {
	--font-sans-stack: var(--font-latin-sans), 'Noto Sans Thai', system-ui, sans-serif;
	--font-serif-stack: var(--font-latin-serif), 'Noto Serif Thai', serif;
	overflow-wrap: anywhere;
}

@layer base {
	body {
		background: var(--cream-100);
		color: var(--ink-900);
		font-family: var(--font-sans-stack);
		font-size: 1rem;
		line-height: 1.65;
	}
	h1, h2, h3 { line-height: 1.15; }
	:focus-visible { outline: 2px solid var(--forest-700); outline-offset: 3px; }
	.on-dark :focus-visible { outline-color: var(--lime-400); }
	img, video { max-width: 100%; height: auto; }
}

.prose-md { max-width: 68ch; }
.prose-md p { margin-block: 1em; }
.prose-md h2 { font-size: 1.5rem; margin-block: 1.6em 0.6em; font-weight: 600; }
.prose-md h3 { font-size: 1.2rem; margin-block: 1.4em 0.5em; font-weight: 600; }
.prose-md ul { list-style: disc; padding-left: 1.4em; margin-block: 1em; }
.prose-md ol { list-style: decimal; padding-left: 1.4em; margin-block: 1em; }
.prose-md a { text-decoration: underline; text-underline-offset: 3px; }

.hero-scrim {
	background: linear-gradient(
		to bottom,
		color-mix(in srgb, var(--forest-900) 60%, transparent),
		color-mix(in srgb, var(--forest-900) 40%, transparent) 45%,
		color-mix(in srgb, var(--forest-900) 78%, transparent)
	);
}
.hero-media { animation: hero-settle 1.2s ease-out both; }
@keyframes hero-settle { from { transform: scale(1.04); } to { transform: none; } }

.js .reveal { opacity: 0; transform: translateY(12px); transition: opacity 0.3s ease, transform 0.3s ease; }
.js .reveal.is-visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
	.hero-media { animation: none; }
	.js .reveal { transform: none; transition: opacity 0.2s ease; }
	html { scroll-behavior: auto; }
}
```

- [ ] **Step 7: Write the small shared pieces**

`src/lib/i18n/context.ts`:

```ts
import { getContext, setContext } from 'svelte';
import type { Lang } from './config';
import { t as translate, type DictKey } from './index';

export type TFn = (key: DictKey, vars?: Record<string, string | number>) => string;

export function provideT(getLang: () => Lang): TFn {
	const fn: TFn = (key, vars) => translate(getLang(), key, vars);
	setContext('t', fn);
	return fn;
}
export const useT = () => getContext<TFn>('t');
```

`src/lib/components/ui/reveal.ts`:

```ts
export function reveal(node: HTMLElement) {
	if (typeof IntersectionObserver === 'undefined') return;
	if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;
	node.classList.add('reveal');
	const io = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting) {
				node.classList.add('is-visible');
				io.disconnect();
			}
		},
		{ threshold: 0.15 }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}
```

`src/lib/components/ui/Img.svelte`:

```svelte
<script lang="ts">
	let { src, alt, class: cls = '', width, height, loading = 'lazy' }: {
		src: string | null; alt: string; class?: string; width?: number; height?: number; loading?: 'lazy' | 'eager';
	} = $props();
	let failed = $state(false);
</script>

{#if src && !failed}
	<img {src} {alt} {width} {height} {loading} class={cls} onerror={() => (failed = true)} />
{:else}
	<div role="img" aria-label={alt} class="flex items-center justify-center bg-stone-600/10 p-3 text-center text-sm text-stone-600 {cls}">
		{alt}
	</div>
{/if}
```

`src/lib/components/ui/Dialog.svelte`:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { open = $bindable(false), label, children }: { open: boolean; label: string; children: Snippet } = $props();
	let el: HTMLDialogElement | undefined = $state();
	$effect(() => {
		if (!el) return;
		if (open && !el.open) el.showModal();
		if (!open && el.open) el.close();
	});
</script>

<dialog bind:this={el} aria-label={label} onclose={() => (open = false)}
	onclick={(e) => { if (e.target === el) open = false; }}
	class="m-auto w-[min(92vw,56rem)] rounded-md bg-cream-100 p-0 text-ink-900 shadow-2xl backdrop:bg-forest-900/70">
	<div class="p-6">{@render children()}</div>
</dialog>
```

- [ ] **Step 8: Write the root layout, redirects, and uploads route**

`src/routes/+layout.server.ts`:

```ts
import { db } from '$lib/server/db/instance';
import { getSettings } from '$lib/server/content';
import { DEFAULT_THEME, themeToCss, validateTheme } from '$lib/theme/tokens';

export const load = () => {
	const stored = getSettings(db, 'en')?.theme;
	const checked = stored ? validateTheme(stored) : null;
	return { themeCss: themeToCss(checked?.ok ? checked.theme : DEFAULT_THEME) };
};
```

`src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import '../app.css';
	let { data, children } = $props();
</script>

<svelte:head>
	{@html `<style>${data.themeCss}</style>`}
</svelte:head>

{@render children()}
```

`src/routes/+page.server.ts`:

```ts
import { redirect } from '@sveltejs/kit';
import { parseAcceptLanguage } from '$lib/i18n/translate';

export const load = ({ request }) => {
	throw redirect(307, `/${parseAcceptLanguage(request.headers.get('accept-language'))}`);
};
```

`src/routes/[...rest]/+page.server.ts` (language-less paths such as `/products`). A path that already starts with a language but matches no route must be a 404, never a redirect, or it would loop (`/en/zzz` to `/en/en/zzz` and so on):

```ts
import { error, redirect } from '@sveltejs/kit';
import { isLang } from '$lib/i18n/config';
import { parseAcceptLanguage } from '$lib/i18n/translate';

export const load = ({ request, params, url }) => {
	if (isLang(params.rest.split('/')[0].toLowerCase())) throw error(404);
	const lang = parseAcceptLanguage(request.headers.get('accept-language'));
	throw redirect(307, `/${lang}/${params.rest}${url.search}`);
};
```

`src/routes/+error.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/state';
</script>

<main class="mx-auto flex min-h-[100svh] max-w-xl flex-col justify-center px-4">
	<h1 class="font-serif text-4xl text-forest-700">{page.status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
	<a href="/" class="mt-6 text-forest-700 underline">Back to home</a>
</main>
```

`src/routes/uploads/[...path]/+server.ts`:

```ts
import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { env } from '$env/dynamic/private';
import { resolveUploadPath } from '$lib/server/upload';

const TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4'
};

export const GET = async ({ params }) => {
	const full = resolveUploadPath(env.UPLOAD_DIR ?? 'data/uploads', params.path);
	const type = full ? TYPES[extname(full).toLowerCase()] : undefined;
	if (!full || !type) throw error(404);
	try {
		const body = await readFile(full);
		return new Response(body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=31536000, immutable' } });
	} catch {
		throw error(404);
	}
};
```

Note: video files are served whole (no range requests); acceptable for the short hero loop.

- [ ] **Step 9: Write the language layout**

`src/routes/[lang=lang]/+layout.server.ts`:

```ts
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/instance';
import { getChrome } from '$lib/server/content';
import { LANGUAGES, type Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const lang = params.lang as Lang;
	const { settings, nav, visible } = getChrome(db, lang);
	const wa = settings?.whatsappUrl && /^https:\/\//.test(settings.whatsappUrl) ? settings.whatsappUrl : null;
	const contact =
		wa ?? (settings?.contactEmail ? `mailto:${settings.contactEmail}` : settings?.contactPhone ? `tel:${settings.contactPhone.replace(/[^\d+]/g, '')}` : null);
	return {
		lang, settings, nav, visible, contact,
		languages: LANGUAGES.filter((l) => l.enabled),
		newsletterEnabled: dev || env.NEWSLETTER_ENABLED === 'true'
	};
};
```

`src/routes/[lang=lang]/+layout.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { provideT } from '$lib/i18n/context';
	import Navbar from '$lib/components/site/Navbar.svelte';
	import Footer from '$lib/components/site/Footer.svelte';

	let { data, children } = $props();
	const t = provideT(() => data.lang);
	const rest = $derived(page.url.pathname.replace(/^\/[^/]+/, ''));
	const overHero = $derived(rest === '' || rest === '/');
</script>

<svelte:head>
	{#each data.languages as l (l.code)}
		<link rel="alternate" hreflang={l.htmlLang} href={`${page.url.origin}/${l.code}${rest}`} />
	{/each}
</svelte:head>

<a href="#main" class="sr-only z-50 rounded-sm bg-lime-400 px-4 py-2 text-forest-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
	{t('nav.skip')}
</a>
<Navbar lang={data.lang} settings={data.settings} nav={data.nav} languages={data.languages} contact={data.contact} {overHero} pathRest={rest} />
<main id="main">{@render children()}</main>
<Footer lang={data.lang} settings={data.settings} nav={data.nav} contact={data.contact} />
```

`src/routes/[lang=lang]/+error.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import type { Lang } from '$lib/i18n/config';
	const lang = $derived(page.params.lang as Lang);
</script>

<div class="mx-auto flex min-h-[70svh] max-w-xl flex-col justify-center px-4 pt-28">
	<h1 class="font-serif text-4xl text-forest-700">{page.status === 404 ? t(lang, 'common.notFound') : t(lang, 'common.error')}</h1>
	<a href="/{lang}" class="mt-6 text-forest-700 underline">{t(lang, 'common.backHome')}</a>
</div>
```

`src/routes/[lang=lang]/+page.svelte` (placeholder, replaced in Task 11):

```svelte
<h1 class="px-4 pt-32 text-3xl">Landing placeholder</h1>
```

- [ ] **Step 10: Write `LanguageSwitcher`, `Navbar`, `Footer`**

`LanguageSwitcher.svelte`:

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';
	let { lang, languages, pathRest, onDark = false }: {
		lang: Lang; languages: readonly { code: string; label: string; htmlLang: string }[]; pathRest: string; onDark?: boolean;
	} = $props();
	const t = useT();
	let details: HTMLDetailsElement | undefined = $state();
	const current = $derived(languages.find((l) => l.code === lang));
</script>

<details bind:this={details} class="relative" onkeydown={(e) => { if (e.key === 'Escape' && details) details.open = false; }}>
	<summary class="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm px-3 text-sm" aria-label={t('nav.language')}>
		{current?.label}
	</summary>
	<ul class="absolute right-0 z-50 mt-2 min-w-44 rounded-md bg-cream-100 p-1 text-ink-900 shadow-xl">
		{#each languages as l (l.code)}
			<li>
				<a href="/{l.code}{pathRest}" hreflang={l.htmlLang} lang={l.htmlLang} data-sveltekit-reload
					aria-current={l.code === lang ? 'true' : undefined}
					class="flex min-h-11 items-center rounded-sm px-3 text-sm hover:bg-forest-700/10 {l.code === lang ? 'bg-forest-700 text-lime-400' : ''}">
					{l.label}
				</a>
			</li>
		{/each}
	</ul>
</details>
```

`Navbar.svelte`:

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import Img from '../ui/Img.svelte';

	let { lang, settings, nav, languages, contact, overHero, pathRest }: {
		lang: Lang; settings: any; nav: { key: string; labelKey: any; path: string }[];
		languages: any[]; contact: string | null; overHero: boolean; pathRest: string;
	} = $props();
	const t = useT();
	let scrolled = $state(false);
	let menu: HTMLDialogElement | undefined = $state();
	const solid = $derived(scrolled || !overHero);
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 80)} />

<header class="on-dark fixed inset-x-0 top-0 z-40 text-cream-100 transition-colors duration-200 {solid ? 'bg-forest-900' : 'bg-transparent'}">
	<div class="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
		<nav class="hidden items-center gap-1 lg:flex" aria-label="Main">
			{#each nav as item (item.key)}
				<a href="/{lang}{item.path}" class="flex min-h-11 items-center rounded-sm px-3 text-sm hover:underline">{t(item.labelKey)}</a>
			{/each}
		</nav>
		<button class="flex size-11 items-center justify-center rounded-sm lg:hidden" aria-label={t('nav.menuOpen')} onclick={() => menu?.showModal()}>
			<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" /></svg>
		</button>

		<a href="/{lang}" class="flex items-center justify-self-center" aria-label={settings?.brandName}>
			{#if settings?.logoImage}
				<Img src={settings.logoImage} alt={settings.brandName} class="h-8 w-auto" loading="eager" />
			{:else}
				<span class="font-serif text-xl">{settings?.brandName}</span>
			{/if}
		</a>

		<div class="flex items-center justify-self-end gap-1">
			{#if contact}
				<a href={contact} class="hidden min-h-11 items-center rounded-sm px-3 text-sm hover:underline sm:flex">{t('nav.contact')}</a>
			{/if}
			<LanguageSwitcher {lang} {languages} {pathRest} onDark />
		</div>
	</div>
</header>

<dialog bind:this={menu} aria-label={t('nav.menuOpen')} class="on-dark m-0 h-full max-h-none w-[min(86vw,20rem)] bg-forest-900 p-0 text-cream-100 backdrop:bg-forest-900/60">
	<div class="flex h-full flex-col p-4">
		<button class="mb-4 flex size-11 items-center justify-center self-end rounded-sm" aria-label={t('nav.menuClose')} onclick={() => menu?.close()}>
			<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" /></svg>
		</button>
		<ul class="space-y-1">
			{#each nav as item (item.key)}
				<li><a href="/{lang}{item.path}" onclick={() => menu?.close()} class="flex min-h-12 items-center rounded-sm px-3 text-lg">{t(item.labelKey)}</a></li>
			{/each}
			{#if contact}
				<li><a href={contact} class="flex min-h-12 items-center rounded-sm px-3 text-lg">{t('nav.contact')}</a></li>
			{/if}
		</ul>
	</div>
</dialog>
```

`Footer.svelte`:

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';
	let { lang, settings, nav, contact }: { lang: Lang; settings: any; nav: { key: string; labelKey: any; path: string }[]; contact: string | null } = $props();
	const t = useT();
	const labels: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube' };
	const socials = $derived((settings?.socialLinks ?? []).filter((s: any) => /^https:\/\//.test(s.url)));
</script>

<footer class="on-dark bg-forest-900 text-cream-100">
	<div class="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
		<div>
			<p class="font-serif text-2xl">{settings?.brandName}</p>
			{#if settings?.t?.footerNote}<p class="mt-3 max-w-prose text-sm text-cream-100/80">{settings.t.footerNote}</p>{/if}
		</div>
		<div class="grid gap-8 sm:grid-cols-3">
			{#if nav.length}
				<nav aria-label={t('footer.sections')}>
					<h2 class="text-sm font-semibold">{t('footer.sections')}</h2>
					<ul class="mt-3 space-y-1">
						{#each nav as item (item.key)}
							<li><a href="/{lang}{item.path}" class="inline-flex min-h-11 items-center text-sm hover:underline">{t(item.labelKey)}</a></li>
						{/each}
					</ul>
				</nav>
			{/if}
			{#if contact}
				<div>
					<h2 class="text-sm font-semibold">{t('footer.contact')}</h2>
					<a href={contact} class="mt-3 inline-flex min-h-11 items-center text-sm hover:underline">{contact.replace(/^(mailto:|tel:|https:\/\/)/, '')}</a>
				</div>
			{/if}
			{#if socials.length}
				<div>
					<h2 class="text-sm font-semibold">{t('footer.follow')}</h2>
					<ul class="mt-3 space-y-1">
						{#each socials as s (s.url)}
							<li><a href={s.url} rel="noopener noreferrer" target="_blank" class="inline-flex min-h-11 items-center text-sm hover:underline">{labels[s.platform] ?? s.platform}</a></li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
	<p class="border-t border-cream-100/15 px-4 py-4 text-center text-sm text-cream-100/70">&copy; {new Date().getFullYear()} {settings?.brandName}</p>
</footer>
```

- [ ] **Step 11: Verify in the browser**

Run `npm run dev` (use the preview tool). Open `http://localhost:5173/`. Expected: redirects to `/en`; navbar shows the logo and nav links Products, Testimonials (only if curated), Accolades, News, About; footer shows social links; no console errors. Open `/zh-tw`: `<html lang="zh-TW">`. Open `/xx/products`: redirects to `/en/products` (404 page in English is fine until Task 12). Resize to 360 px: the menu button appears, opens a drawer, Escape closes it, no horizontal scroll.

- [ ] **Step 12: Commit** — `git add -A && git commit -m "feat: site shell with theme, navbar, footer, language switcher, uploads route" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`

---

### Task 10: Newsletter (subscribe logic, endpoint, component)

**Files:**
- Create: `src/lib/server/subscribe.ts`, `src/routes/api/subscribe/+server.ts`, `src/lib/components/site/Newsletter.svelte`
- Test: `src/lib/server/subscribe.test.ts`

**Interfaces:**
- Consumes: `Db`, schema, `RateLimiter`.
- Produces:
  - `normalizeEmail(raw: string): string | null`
  - `subscribe(db: Db, rawEmail: string, lang: string): 'ok' | 'invalid' | 'duplicate'`
  - `POST /api/subscribe` (form fields `email`, `lang`): JSON `{ status }` when `Accept: application/json`, else 303 redirect to the referer with `?newsletter={status}`
  - `Newsletter` props `{ lang: Lang; enabled: boolean; initialStatus?: string | null }`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createDb } from './db';
import * as s from './db/schema';
import { normalizeEmail, subscribe } from './subscribe';

describe('normalizeEmail', () => {
	it.each([
		['  User@Example.COM ', 'user@example.com'],
		['a@b.co', 'a@b.co']
	])('%s -> %s', (raw, expected) => expect(normalizeEmail(raw)).toBe(expected));
	it.each(['', 'nope', 'a@b', '@b.co', 'a b@c.co', 'a@b.c', `${'x'.repeat(250)}@b.co`, 'a@b.co\nBcc: x@y.co'])(
		'rejects %j',
		(raw) => expect(normalizeEmail(raw)).toBeNull()
	);
});

describe('subscribe', () => {
	it('stores a valid address once, case-insensitively', () => {
		const db = createDb(':memory:');
		expect(subscribe(db, 'A@B.co', 'en')).toBe('ok');
		expect(subscribe(db, ' a@b.CO', 'zh')).toBe('duplicate');
		expect(db.select().from(s.subscribers).all()).toHaveLength(1);
	});
	it('rejects invalid input without writing', () => {
		const db = createDb(':memory:');
		expect(subscribe(db, 'bad', 'en')).toBe('invalid');
		expect(db.select().from(s.subscribers).all()).toHaveLength(0);
	});
	it('falls back to en for an unknown language', () => {
		const db = createDb(':memory:');
		subscribe(db, 'a@b.co', 'xx');
		expect(db.select().from(s.subscribers).get()?.lang).toBe('en');
	});
});
```

- [ ] **Step 2: Run, see it fail.**

- [ ] **Step 3: Implement `subscribe.ts`**

```ts
import type { Db } from './db';
import * as s from './db/schema';
import { isLang } from '../i18n/config';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: string): string | null {
	const e = raw.trim().toLowerCase();
	return e.length <= 254 && EMAIL.test(e) ? e : null;
}

export function subscribe(db: Db, rawEmail: string, lang: string): 'ok' | 'invalid' | 'duplicate' {
	const email = normalizeEmail(rawEmail);
	if (!email) return 'invalid';
	const res = db.insert(s.subscribers).values({ email, lang: isLang(lang) ? lang : 'en' }).onConflictDoNothing().run();
	return res.changes === 0 ? 'duplicate' : 'ok';
}
```

- [ ] **Step 4: Run tests** — expect pass.

- [ ] **Step 5: Write the endpoint**

`src/routes/api/subscribe/+server.ts`:

```ts
import { error, json, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/instance';
import { subscribe } from '$lib/server/subscribe';
import { RateLimiter } from '$lib/server/rate-limit';

const limiter = new RateLimiter(10, 60 * 60_000);

export const POST = async ({ request, getClientAddress }) => {
	if (!(dev || env.NEWSLETTER_ENABLED === 'true')) throw error(403, 'Newsletter is not enabled');
	const ip = getClientAddress();
	const wantsJson = request.headers.get('accept')?.includes('application/json');
	let status: string;
	if (limiter.isBlocked(ip)) status = 'failed';
	else {
		limiter.fail(ip);
		const fd = await request.formData();
		try {
			status = subscribe(db, String(fd.get('email') ?? ''), String(fd.get('lang') ?? 'en'));
		} catch (e) {
			console.error('subscribe failed', e);
			status = 'failed';
		}
	}
	if (wantsJson) return json({ status }, { status: status === 'failed' ? 500 : 200 });
	const back = new URL(request.headers.get('referer') ?? '/', request.url);
	back.searchParams.set('newsletter', status);
	throw redirect(303, back.pathname + back.search + '#newsletter');
};
```

- [ ] **Step 6: Write `Newsletter.svelte`**

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';

	let { lang, enabled }: { lang: Lang; enabled: boolean } = $props();
	const t = useT();
	type Status = 'idle' | 'sending' | 'ok' | 'invalid' | 'duplicate' | 'failed';
	const fromUrl = page.url.searchParams.get('newsletter');
	let status: Status = $state((['ok', 'invalid', 'duplicate', 'failed'] as string[]).includes(fromUrl ?? '') ? (fromUrl as Status) : 'idle');
	const messages: Record<string, 'newsletter.success' | 'newsletter.invalid' | 'newsletter.duplicate' | 'newsletter.failed'> = {
		ok: 'newsletter.success', invalid: 'newsletter.invalid', duplicate: 'newsletter.duplicate', failed: 'newsletter.failed'
	};

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		status = 'sending';
		try {
			const res = await fetch('/api/subscribe', { method: 'POST', body: new FormData(e.currentTarget as HTMLFormElement), headers: { accept: 'application/json' } });
			status = ((await res.json()).status as Status) ?? 'failed';
		} catch {
			status = 'failed';
		}
	}
</script>

<section id="newsletter" class="on-dark bg-forest-900 py-16 text-cream-100">
	<div class="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_28rem] lg:items-end">
		<h2 class="font-serif text-3xl sm:text-4xl">{t('newsletter.title')}</h2>
		{#if enabled}
			<form method="post" action="/api/subscribe" onsubmit={submit} novalidate>
				<input type="hidden" name="lang" value={lang} />
				<label for="nl-email" class="text-sm">{t('newsletter.label')}</label>
				<div class="mt-2 flex flex-col gap-3 sm:flex-row">
					<input id="nl-email" name="email" type="email" required autocomplete="email" placeholder={t('newsletter.placeholder')}
						aria-describedby="nl-msg" aria-invalid={status === 'invalid' || status === 'duplicate' ? 'true' : undefined}
						class="min-h-12 w-full rounded-sm border border-cream-100/40 bg-forest-700 px-3 text-cream-100 placeholder:text-cream-100/60" />
					<button disabled={status === 'sending'} class="min-h-12 rounded-sm bg-cream-100 px-5 font-medium text-forest-900 disabled:opacity-60">
						{status === 'sending' ? t('newsletter.sending') : t('newsletter.submit')}
					</button>
				</div>
				<p id="nl-msg" role={status === 'ok' ? 'status' : 'alert'} class="mt-2 min-h-6 text-sm">
					{#if messages[status]}{t(messages[status])}{/if}
				</p>
			</form>
		{:else}
			<p class="text-cream-100/80">{t('newsletter.unavailable')}</p>
		{/if}
	</div>
</section>
```

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: newsletter subscription" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"` (the component is exercised in Task 11 and the e2e test in Task 15).

---

### Task 11: Landing page sections

**Files:**
- Create: `src/lib/components/site/{Hero,BestSeller,Collections,ProductCard,AboutTeaser,Testimonials,YouTubeEmbed,Accolades,NewsSection,NewsRow}.svelte`
- Modify: `src/routes/[lang=lang]/+page.svelte` (replace placeholder), create `src/routes/[lang=lang]/+page.server.ts`
- Test: verified in the browser here; automated in Task 15

**Interfaces:**
- Consumes: `getLandingData` (Task 5), `renderMarkdown`, `youtubeId`, `formatDate`, `Newsletter`, `Dialog`, `Img`, `reveal`, `useT`.
- Produces: the landing page rendering `data.visible` in order.

- [ ] **Step 1: Page loader**

`src/routes/[lang=lang]/+page.server.ts`:

```ts
import { db } from '$lib/server/db/instance';
import { getLandingData } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import { youtubeId } from '$lib/youtube';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const d = getLandingData(db, params.lang as Lang);
	return {
		...d,
		aboutHtml: renderMarkdown(d.settings?.t?.aboutTeaserMd),
		testimonials: d.testimonials.map((x) => ({ ...x, videoId: youtubeId(x.youtubeUrl) })).filter((x) => x.videoId)
	};
};
```

(Testimonials whose URL is not a valid YouTube video are dropped here, so a bad admin entry never produces a broken player.)

- [ ] **Step 2: `ProductCard.svelte`**

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import Img from '../ui/Img.svelte';
	let { lang, product }: { lang: string; product: any } = $props();
	const t = useT();
</script>

<a href="/{lang}/products/{product.slug}" lang={product.usedLang !== lang ? product.usedLang : undefined}
	class="group block h-full rounded-md bg-cream-100 p-4 text-ink-900">
	<div class="relative aspect-[4/5] overflow-hidden rounded-sm bg-white">
		<Img src={product.mainImage} alt={product.t.imageAlt ?? product.t.name} class="size-full object-contain p-4 transition-transform duration-200 group-hover:scale-[1.03]" />
		{#if product.isBestSeller}
			<span class="absolute left-2 top-2 rounded-sm bg-lime-400 px-2 py-1 text-xs font-medium text-forest-900">{t('bestSeller.label')}</span>
		{/if}
	</div>
	<h3 class="mt-4 font-serif text-xl text-forest-700">{product.t.name}</h3>
	{#if product.t.shortDescription}<p class="mt-1 line-clamp-2 text-sm text-stone-600">{product.t.shortDescription}</p>{/if}
</a>
```

- [ ] **Step 3: `Hero.svelte`**

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import Img from '../ui/Img.svelte';
	let { lang, settings, bestSeller, testimonial }: { lang: string; settings: any; bestSeller: any; testimonial: any } = $props();
	const t = useT();
	const tr = $derived(settings?.t);
	const line1 = $derived(tr?.headlineLine1 ?? tr?.tagline ?? settings?.brandName);
	const line2 = $derived(tr?.headlineLine2);
	const productImage = $derived(settings?.heroProductImage ?? bestSeller?.mainImage);
	let video: HTMLVideoElement | undefined = $state();
	let paused = $state(false);
	onMount(() => {
		if (settings?.heroMediaType === 'video' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
			video?.pause();
			paused = true;
		}
	});
	function toggle() {
		if (!video) return;
		if (video.paused) { video.play(); paused = false; } else { video.pause(); paused = true; }
	}
</script>

<section id="hero" class="on-dark relative isolate flex min-h-[100svh] items-center overflow-hidden text-cream-100">
	{#if settings?.heroMedia && settings.heroMediaType === 'video'}
		<video bind:this={video} class="hero-media absolute inset-0 -z-20 size-full object-cover" src={settings.heroMedia} autoplay muted loop playsinline preload="metadata"></video>
	{:else if settings?.heroMedia}
		<img src={settings.heroMedia} alt="" class="hero-media absolute inset-0 -z-20 size-full object-cover" />
	{:else}
		<div class="absolute inset-0 -z-20 bg-forest-700"></div>
	{/if}
	<div class="hero-scrim absolute inset-0 -z-10"></div>

	<div class="mx-auto grid w-full max-w-7xl items-center gap-4 px-4 pb-40 pt-28 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
		<h1 class="text-[clamp(2.5rem,7vw,6rem)] font-semibold leading-none lg:text-right">{line1}</h1>

		{#if productImage}
			<div class="relative mx-auto">
				<Img src={productImage} alt={bestSeller?.t.imageAlt ?? bestSeller?.t.name ?? settings?.brandName} loading="eager"
					class="h-[44svh] w-auto object-contain lg:h-[62svh]" />
				{#if tr?.heroBadgeText}
					<div class="absolute -right-4 top-6 grid size-28 place-items-center rounded-full border border-cream-100/60 bg-forest-900/70 p-3 text-center text-sm lg:-right-16">
						{tr.heroBadgeText}
					</div>
				{/if}
			</div>
		{/if}

		<div class="max-w-md">
			{#if line2}<p class="text-[clamp(2.5rem,7vw,6rem)] font-semibold leading-none">{line2}</p>{/if}
			{#if tr?.subheadline}<p class="mt-5 text-cream-100/90">{tr.subheadline}</p>{/if}
			{#if bestSeller}
				<a href="/{lang}/products/{bestSeller.slug}" class="mt-7 inline-flex min-h-12 items-center rounded-full bg-lime-400 px-8 font-medium text-forest-900">
					{tr?.ctaLabel ?? t('hero.cta', { name: bestSeller.t.name })}
				</a>
			{/if}
		</div>
	</div>

	{#if testimonial}
		<a href="/{lang}/testimonials" class="absolute bottom-8 left-4 w-[min(20rem,calc(100%-2rem))] rounded-md border border-cream-100/25 bg-cream-100/10 p-4 backdrop-blur-md sm:left-6">
			<span class="text-xs text-cream-100/80">{t('nav.testimonials')}</span>
			<span class="mt-1 block font-serif text-lg leading-snug">{testimonial.t.title}</span>
			<span class="mt-2 inline-block text-sm underline">{t('testimonials.play')}</span>
		</a>
	{/if}

	{#if settings?.heroMedia && settings.heroMediaType === 'video'}
		<button onclick={toggle} class="absolute bottom-8 right-4 min-h-11 rounded-sm border border-cream-100/40 px-4 text-sm sm:right-6">
			{paused ? t('hero.play') : t('hero.pause')}
		</button>
	{/if}
</section>
```

(The testimonial teaser card is the single `backdrop-blur` element on the page, per the dose cap.)

- [ ] **Step 4: `BestSeller.svelte` and `AboutTeaser.svelte`**

`BestSeller.svelte`:

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import Img from '../ui/Img.svelte';
	let { lang, product }: { lang: string; product: any } = $props();
	const t = useT();
</script>

<section id="best-seller" class="bg-cream-100 px-4 py-24 sm:px-6">
	<div class="relative mx-auto max-w-7xl rounded-md bg-white p-8 shadow-xl lg:p-14" use:reveal>
		<div class="grid items-center gap-10 lg:grid-cols-12">
			<div class="lg:col-span-6">
				<p class="inline-block rounded-sm bg-lime-400 px-2 py-1 text-xs font-medium text-forest-900">{t('bestSeller.label')}</p>
				<h2 class="mt-4 font-serif text-[clamp(2rem,4vw,3.5rem)] text-forest-700">{product.t.name}</h2>
				{#if product.t.shortDescription}<p class="mt-4 max-w-prose text-stone-600">{product.t.shortDescription}</p>{/if}
				{#if product.t.benefits?.length}
					<ul class="mt-6 flex flex-wrap gap-2">
						{#each product.t.benefits.slice(0, 3) as b (b)}
							<li class="rounded-sm border border-forest-700/30 px-3 py-1 text-sm">{b}</li>
						{/each}
					</ul>
				{/if}
				<a href="/{lang}/products/{product.slug}" class="mt-8 inline-flex min-h-12 items-center rounded-sm bg-forest-700 px-6 font-medium text-cream-100">{t('bestSeller.view')}</a>
			</div>
			<div class="lg:col-span-6">
				<Img src={product.mainImage} alt={product.t.imageAlt ?? product.t.name}
					class="mx-auto h-[26rem] w-auto object-contain lg:-my-20 lg:h-[34rem] lg:translate-x-10" />
			</div>
		</div>
	</div>
</section>
```

`AboutTeaser.svelte`:

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	let { lang, html, hasFullAbout }: { lang: string; html: string; hasFullAbout: boolean } = $props();
	const t = useT();
</script>

<section id="about" class="bg-cream-100 px-4 py-28 sm:px-6">
	<div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12" use:reveal>
		<h2 class="text-sm font-semibold text-stone-600 lg:col-span-3">{t('about.title')}</h2>
		<div class="lg:col-span-8 lg:col-start-4">
			<div class="font-serif text-[clamp(1.5rem,3vw,2.5rem)] leading-snug text-forest-700 [&_p]:m-0">{@html html}</div>
			{#if hasFullAbout}
				<a href="/{lang}/about" class="mt-8 inline-flex min-h-12 items-center text-forest-700 underline underline-offset-4">{t('about.more')}</a>
			{/if}
		</div>
	</div>
</section>
```

- [ ] **Step 5: `Collections.svelte`**

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import ProductCard from './ProductCard.svelte';
	let { lang, collections, products }: { lang: string; collections: any[]; products: any[] } = $props();
	const t = useT();
	let activeId = $state(collections[0]?.id);
	let rail: HTMLElement | undefined = $state();
	const shown = $derived(products.filter((p) => p.collectionId === activeId));
	const scrollBy = (dir: number) => rail?.scrollBy({ left: dir * 320, behavior: 'smooth' });
</script>

<section id="collections" class="on-dark bg-forest-700 px-4 py-24 text-cream-100 sm:px-6">
	<div class="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[16rem_1fr]">
		<div use:reveal>
			<h2 class="font-serif text-3xl">{t('collections.title')}</h2>
			<ul class="mt-6 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
				{#each collections as c (c.id)}
					<li>
						<button aria-pressed={c.id === activeId} onclick={() => (activeId = c.id)}
							class="flex min-h-11 w-full items-center rounded-sm px-3 text-left {c.id === activeId ? 'bg-cream-100 text-forest-900' : 'hover:bg-cream-100/10'}">
							<span>
								<span class="block font-medium">{c.t.name}</span>
								{#if c.t.tagline}<span class="block text-sm opacity-80">{c.t.tagline}</span>{/if}
							</span>
						</button>
					</li>
				{/each}
			</ul>
			<a href="/{lang}/products" class="mt-8 inline-flex min-h-11 items-center underline underline-offset-4">{t('collections.viewAll')}</a>
		</div>

		<div class="min-w-0">
			<ul bind:this={rail} class="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
				{#each shown as p (p.id)}
					<li class="w-64 shrink-0 snap-start sm:w-72"><ProductCard {lang} product={p} /></li>
				{/each}
			</ul>
			{#if shown.length > 3}
				<div class="mt-2 flex gap-2">
					<button class="size-11 rounded-sm border border-cream-100/40" aria-label={t('common.prevPage')} onclick={() => scrollBy(-1)}>
						<svg viewBox="0 0 20 20" class="mx-auto size-5" aria-hidden="true"><path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
					</button>
					<button class="size-11 rounded-sm border border-cream-100/40" aria-label={t('common.nextPage')} onclick={() => scrollBy(1)}>
						<svg viewBox="0 0 20 20" class="mx-auto size-5" aria-hidden="true"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
					</button>
				</div>
			{/if}
		</div>
	</div>
</section>
```

- [ ] **Step 6: `YouTubeEmbed.svelte` and `Testimonials.svelte`**

`YouTubeEmbed.svelte`:

```svelte
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import Img from '../ui/Img.svelte';
	let { videoId, title, poster = null }: { videoId: string; title: string; poster?: string | null } = $props();
	const t = useT();
	let state: 'idle' | 'loading' | 'ready' | 'error' = $state('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;
	function start() {
		state = 'loading';
		timer = setTimeout(() => { if (state === 'loading') state = 'error'; }, 12000);
	}
	onDestroy(() => clearTimeout(timer));
	$effect(() => { videoId; state = 'idle'; });
</script>

<div class="relative aspect-video w-full overflow-hidden rounded-md bg-forest-900">
	{#if state === 'idle' || state === 'loading' || state === 'ready'}
		{#if state !== 'idle'}
			<iframe class="absolute inset-0 size-full" title={title} src="https://www.youtube-nocookie.com/embed/{videoId}?autoplay=1&rel=0"
				allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen onload={() => { state = 'ready'; clearTimeout(timer); }}></iframe>
		{/if}
		{#if state !== 'ready'}
			<button onclick={start} disabled={state === 'loading'} class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-cream-100">
				{#if poster}<Img src={poster} alt="" class="absolute inset-0 -z-10 size-full object-cover opacity-70" />{/if}
				<span class="flex size-16 items-center justify-center rounded-full bg-cream-100 text-forest-900" aria-hidden="true">
					<svg viewBox="0 0 24 24" class="size-7"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
				</span>
				<span class="px-4 text-center">{state === 'loading' ? t('testimonials.loading') : t('testimonials.play')}: {title}</span>
			</button>
		{/if}
	{:else}
		<div class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-cream-100" role="alert">
			<p>{t('testimonials.error')}</p>
			<a class="underline" href="https://www.youtube.com/watch?v={videoId}" target="_blank" rel="noopener noreferrer">{t('testimonials.openYoutube')}</a>
		</div>
	{/if}
</div>
```

`Testimonials.svelte`:

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import YouTubeEmbed from './YouTubeEmbed.svelte';
	let { lang, items, showAll = true }: { lang: string; items: any[]; showAll?: boolean } = $props();
	const t = useT();
	let activeId = $state(items[0]?.id);
	const active = $derived(items.find((x) => x.id === activeId) ?? items[0]);
	const others = $derived(items.filter((x) => x.id !== active?.id));
</script>

<section id="testimonials" class="on-dark bg-forest-900 px-4 py-24 text-cream-100 sm:px-6">
	<div class="mx-auto max-w-7xl" use:reveal>
		<h2 class="font-serif text-3xl sm:text-4xl">{t('testimonials.title')}</h2>
		{#if active}
			<div class="mt-10 grid gap-8 lg:grid-cols-12">
				<div class="lg:col-span-8">
					<YouTubeEmbed videoId={active.videoId} title={active.t.title} poster={active.posterImage} />
					<h3 class="mt-4 text-lg font-semibold">{active.t.title}</h3>
					{#if active.t.quote}<p class="mt-2 max-w-prose font-serif text-xl">{active.t.quote}</p>{/if}
					{#if active.personName}<p class="mt-2 text-sm text-cream-100/80">{active.personName}{active.role ? `, ${active.role}` : ''}</p>{/if}
				</div>
				{#if others.length}
					<ul class="space-y-2 lg:col-span-4">
						{#each others as o (o.id)}
							<li>
								<button onclick={() => (activeId = o.id)} class="flex min-h-14 w-full items-center rounded-sm border border-cream-100/25 px-4 text-left hover:bg-cream-100/10">
									{o.t.title}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
		{#if showAll}<a href="/{lang}/testimonials" class="mt-8 inline-flex min-h-11 items-center underline underline-offset-4">{t('testimonials.title')}</a>{/if}
	</div>
</section>
```

- [ ] **Step 7: `Accolades.svelte`**

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import Dialog from '../ui/Dialog.svelte';
	import Img from '../ui/Img.svelte';
	let { lang, items, expanded = false }: { lang: string; items: any[]; expanded?: boolean } = $props();
	const t = useT();
	let selected: any = $state(null);
	let open = $state(false);
	const groups = $derived.by(() => {
		const map = new Map<number | null, any[]>();
		for (const it of items) map.set(it.year ?? null, [...(map.get(it.year ?? null) ?? []), it]);
		return [...map.entries()].sort((a, b) => (a[0] ?? 9999) - (b[0] ?? 9999));
	});
	const hasYears = $derived(items.some((i) => i.year != null));
	function show(it: any) { selected = it; open = true; }
</script>

<section id="accolades" class="bg-cream-100 px-4 py-24 sm:px-6">
	<div class="mx-auto max-w-7xl" use:reveal>
		<h2 class="font-serif text-3xl text-forest-700 sm:text-4xl">{t('accolades.title')}</h2>
		<div class="mt-10 flex gap-10 overflow-x-auto pb-6">
			{#each groups as [year, list] (year)}
				<div class="shrink-0">
					{#if hasYears}
						<div class="flex items-center gap-3">
							<span class="font-serif text-2xl text-forest-700">{year ?? ''}</span>
							<span class="h-px w-24 bg-forest-700/40"></span>
						</div>
					{/if}
					<ul class="mt-4 flex gap-4">
						{#each list as it (it.id)}
							<li class="w-56 shrink-0">
								<button onclick={() => show(it)} class="group block w-full text-left">
									<Img src={it.image} alt={it.t.imageAlt ?? it.t.title} class="aspect-[3/4] w-full rounded-sm bg-white object-contain transition-transform duration-200 group-hover:scale-[1.03]" />
									<span class="mt-2 block text-sm font-medium">{it.t.title}</span>
									{#if expanded && it.t.description}<span class="mt-1 block text-sm text-stone-600">{it.t.description}</span>{/if}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
		{#if !expanded}<a href="/{lang}/accolades" class="inline-flex min-h-11 items-center text-forest-700 underline underline-offset-4">{t('accolades.title')}</a>{/if}
	</div>
</section>

<Dialog bind:open label={selected?.t.title ?? t('accolades.title')}>
	{#if selected}
		<div class="flex justify-end">
			<button onclick={() => (open = false)} class="min-h-11 rounded-sm border border-forest-700/40 px-4">{t('accolades.close')}</button>
		</div>
		<Img src={selected.image} alt={selected.t.imageAlt ?? selected.t.title} class="mx-auto mt-2 max-h-[70vh] w-auto" />
		<h3 class="mt-4 font-serif text-2xl text-forest-700">{selected.t.title}</h3>
		{#if selected.issuer}<p class="text-sm text-stone-600">{t('accolades.issuedBy', { issuer: selected.issuer })}</p>{/if}
		{#if selected.t.description}<p class="mt-2">{selected.t.description}</p>{/if}
	{/if}
</Dialog>
```

- [ ] **Step 8: `NewsRow.svelte` and `NewsSection.svelte`**

`NewsRow.svelte`:

```svelte
<script lang="ts">
	import { formatDate } from '$lib/format';
	import type { Lang } from '$lib/i18n/config';
	let { lang, item }: { lang: Lang; item: any } = $props();
</script>

<a href="/{lang}/news/{item.slug}" class="block border-t border-forest-700/20 py-5 hover:bg-forest-700/5">
	<p class="text-sm text-stone-600">{formatDate(item.eventDate, lang)}{item.location ? `, ${item.location}` : ''}</p>
	<h3 class="mt-1 font-serif text-xl text-forest-700">{item.t.title}</h3>
</a>
```

`NewsSection.svelte`:

```svelte
<script lang="ts">
	import { formatDate } from '$lib/format';
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';
	import { reveal } from '../ui/reveal';
	import Img from '../ui/Img.svelte';
	import NewsRow from './NewsRow.svelte';
	let { lang, items }: { lang: Lang; items: any[] } = $props();
	const t = useT();
	const [featured, ...rest] = $derived(items);
</script>

<section id="news" class="border-t border-forest-700/15 bg-cream-100 px-4 py-24 sm:px-6">
	<div class="mx-auto max-w-7xl" use:reveal>
		<h2 class="font-serif text-3xl text-forest-700 sm:text-4xl">{t('news.title')}</h2>
		<div class="mt-10 grid gap-10 lg:grid-cols-12">
			{#if featured}
				<a href="/{lang}/news/{featured.slug}" class="group block lg:col-span-7">
					<Img src={featured.coverImage} alt={featured.t.coverAlt ?? featured.t.title} class="aspect-[16/10] w-full rounded-md object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
					<p class="mt-4 text-sm text-stone-600">{formatDate(featured.eventDate, lang)}{featured.location ? `, ${featured.location}` : ''}</p>
					<h3 class="mt-1 font-serif text-2xl text-forest-700">{featured.t.title}</h3>
					{#if featured.t.excerpt}<p class="mt-2 max-w-prose text-stone-600">{featured.t.excerpt}</p>{/if}
				</a>
			{/if}
			<div class="lg:col-span-5">
				{#each rest as item (item.id)}<NewsRow {lang} {item} />{/each}
				<a href="/{lang}/news" class="mt-6 inline-flex min-h-11 items-center text-forest-700 underline underline-offset-4">{t('news.viewAll')}</a>
			</div>
		</div>
	</div>
</section>
```

- [ ] **Step 9: Compose the landing page**

`src/routes/[lang=lang]/+page.svelte`:

```svelte
<script lang="ts">
	import Hero from '$lib/components/site/Hero.svelte';
	import BestSeller from '$lib/components/site/BestSeller.svelte';
	import Collections from '$lib/components/site/Collections.svelte';
	import AboutTeaser from '$lib/components/site/AboutTeaser.svelte';
	import Testimonials from '$lib/components/site/Testimonials.svelte';
	import Accolades from '$lib/components/site/Accolades.svelte';
	import NewsSection from '$lib/components/site/NewsSection.svelte';
	import Newsletter from '$lib/components/site/Newsletter.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.settings?.brandName}{data.settings?.t?.tagline ? `, ${data.settings.t.tagline}` : ''}</title>
	{#if data.settings?.t?.subheadline}<meta name="description" content={data.settings.t.subheadline} />{/if}
</svelte:head>

{#each data.visible as key (key)}
	{#if key === 'hero'}
		<Hero lang={data.lang} settings={data.settings} bestSeller={data.bestSeller} testimonial={data.testimonials[0] ?? null} />
	{:else if key === 'best_seller' && data.bestSeller}
		<BestSeller lang={data.lang} product={data.bestSeller} />
	{:else if key === 'collections'}
		<Collections lang={data.lang} collections={data.collections} products={data.products} />
	{:else if key === 'about'}
		<AboutTeaser lang={data.lang} html={data.aboutHtml} hasFullAbout={!!data.settings?.t?.aboutMd} />
	{:else if key === 'testimonials' && data.testimonials.length}
		<Testimonials lang={data.lang} items={data.testimonials} />
	{:else if key === 'accolades'}
		<Accolades lang={data.lang} items={data.accolades} />
	{:else if key === 'news'}
		<NewsSection lang={data.lang} items={data.news} />
	{:else if key === 'newsletter'}
		<Newsletter lang={data.lang} enabled={data.newsletterEnabled} />
	{/if}
{/each}
```

Edge: when `data.visible` has no `hero` (admin disabled it), the fixed navbar overlaps the first section. Add `class="pt-16"` to the wrapper in that case: replace the `{#each}` wrapper with `<div class={data.visible[0] === 'hero' ? '' : 'pt-16'}>…</div>`.

- [ ] **Step 10: Verify in the browser (acceptance items 1, 2, 7 partial)**

Run `npm run dev` and open `/en`. Check, at 1280 px and 360 px: hero headline sits around the bottle; navbar transparent at top then solid after 80 px; best-seller card; collections filter buttons switch the rail; the accolade lightbox opens and Escape closes it; the news section shows 1 featured + 2 rows; newsletter form submits and shows a message; no console errors; no horizontal scroll. Open `/zh`, `/th`, `/id`: text renders in the correct font. Fix any layout bug found, then commit.

- [ ] **Step 11: Commit** — `git add -A && git commit -m "feat: landing page sections" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`

---

### Task 12: Detail and list pages

**Files:**
- Create under `src/routes/[lang=lang]/`: `products/+page.server.ts`, `products/+page.svelte`, `products/[slug]/+page.server.ts`, `products/[slug]/+page.svelte`, `collections/[slug]/+page.server.ts`, `collections/[slug]/+page.svelte`, `news/+page.server.ts`, `news/+page.svelte`, `news/[slug]/+page.server.ts`, `news/[slug]/+page.svelte`, `testimonials/+page.server.ts`, `testimonials/+page.svelte`, `accolades/+page.server.ts`, `accolades/+page.svelte`, `about/+page.server.ts`, `about/+page.svelte`
- Test: automated in Task 15; unit logic already covered in Task 5

**Interfaces:**
- Consumes: content getters, `renderMarkdown`, `youtubeId`, components from Task 11, layout `contact`.
- Produces: all routes in spec section 4. Unknown slugs return 404 through `error(404)`.

Spec 12.2 says product tabs; this plan stacks the sections (Description, Benefits, Ingredients, How to use, FAQs) under headings because the content is short and it avoids a tab widget. Update spec 12.2 in Step 10 to say "stacked sections".

- [ ] **Step 1: Products list**

`products/+page.server.ts`:

```ts
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
```

`products/+page.svelte`:

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import ProductCard from '$lib/components/site/ProductCard.svelte';
	let { data } = $props();
	const t = useT();
</script>

<svelte:head><title>{t('products.title')}</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
	<h1 class="font-serif text-4xl text-forest-700 sm:text-5xl">{t('products.title')}</h1>
	{#if !data.groups.length && !data.loose.length}
		<p class="mt-8 text-stone-600">{t('common.empty')}</p>
	{/if}
	{#each data.groups as g (g.collection.id)}
		<section class="mt-14">
			<h2 class="text-2xl font-semibold"><a href="/{data.lang}/collections/{g.collection.slug}" class="hover:underline">{g.collection.t.name}</a></h2>
			{#if g.collection.t.tagline}<p class="mt-1 text-stone-600">{g.collection.t.tagline}</p>{/if}
			<ul class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each g.products as p (p.id)}<li><ProductCard lang={data.lang} product={p} /></li>{/each}
			</ul>
		</section>
	{/each}
	{#if data.loose.length}
		<ul class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#each data.loose as p (p.id)}<li><ProductCard lang={data.lang} product={p} /></li>{/each}
		</ul>
	{/if}
</div>
```

- [ ] **Step 2: Collection page**

`collections/[slug]/+page.server.ts`:

```ts
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
```

`collections/[slug]/+page.svelte`:

```svelte
<script lang="ts">
	import Img from '$lib/components/ui/Img.svelte';
	import ProductCard from '$lib/components/site/ProductCard.svelte';
	let { data } = $props();
	const c = $derived(data.collection);
</script>

<svelte:head><title>{c.t.name}</title></svelte:head>

<div class="pt-16">
	{#if c.bannerImage}
		<Img src={c.bannerImage} alt={c.t.bannerAlt ?? c.t.name} loading="eager" class="max-h-80 w-full object-cover" />
	{/if}
	<div class="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6">
		<h1 class="font-serif text-4xl text-forest-700 sm:text-5xl">{c.t.name}</h1>
		{#if c.t.tagline}<p class="mt-2 text-lg text-stone-600">{c.t.tagline}</p>{/if}
		{#if c.t.description}<p class="mt-4 max-w-prose">{c.t.description}</p>{/if}
		<ul class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#each data.products as p (p.id)}<li><ProductCard lang={data.lang} product={p} /></li>{/each}
		</ul>
	</div>
</div>
```

- [ ] **Step 3: Product detail**

`products/[slug]/+page.server.ts`:

```ts
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
```

`products/[slug]/+page.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { useT } from '$lib/i18n/context';
	import Img from '$lib/components/ui/Img.svelte';
	import ProductCard from '$lib/components/site/ProductCard.svelte';
	let { data } = $props();
	const t = useT();
	const p = $derived(data.product);
	const images = $derived([p.mainImage, ...(p.gallery ?? [])].filter((x, i, a): x is string => !!x && a.indexOf(x) === i));
	let activeImage = $state(0);
	const contact = $derived(page.data.contact as string | null);
</script>

<svelte:head><title>{p.t.name}</title>{#if p.t.shortDescription}<meta name="description" content={p.t.shortDescription} />{/if}</svelte:head>

<div class="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
	<div class="grid gap-10 lg:grid-cols-2">
		<div>
			<div class="rounded-md bg-white p-6">
				<Img src={images[activeImage] ?? null} alt={p.t.imageAlt ?? p.t.name} loading="eager" class="mx-auto aspect-square w-full object-contain" />
			</div>
			{#if images.length > 1}
				<ul class="mt-3 flex gap-2">
					{#each images as src, i (src)}
						<li>
							<button onclick={() => (activeImage = i)} aria-label="{p.t.name} {i + 1}" aria-current={i === activeImage ? 'true' : undefined}
								class="size-16 rounded-sm bg-white p-1 {i === activeImage ? 'ring-2 ring-forest-700' : ''}">
								<Img {src} alt="" class="size-full object-contain" />
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div>
			{#if data.collection}<a href="/{data.lang}/collections/{data.collection.slug}" class="text-sm text-stone-600 underline">{data.collection.t.name}</a>{/if}
			<h1 class="mt-1 font-serif text-4xl text-forest-700 sm:text-5xl">{p.t.name}</h1>
			{#if p.t.shortDescription}<p class="mt-3 text-lg text-stone-600">{p.t.shortDescription}</p>{/if}
			{#if p.t.benefits?.length}
				<h2 class="mt-8 text-lg font-semibold">{t('products.benefits')}</h2>
				<ul class="mt-3 flex flex-wrap gap-2">
					{#each p.t.benefits as b (b)}<li class="rounded-sm border border-forest-700/30 px-3 py-1 text-sm">{b}</li>{/each}
				</ul>
			{/if}
			{#if contact}
				<a href={contact} class="mt-8 inline-flex min-h-12 items-center rounded-sm bg-forest-700 px-6 font-medium text-cream-100">{t('products.enquire')}</a>
			{/if}
		</div>
	</div>

	<div class="mt-16 space-y-12">
		{#if data.html.description}<section><h2 class="text-2xl font-semibold">{t('products.description')}</h2><div class="prose-md mt-3">{@html data.html.description}</div></section>{/if}
		{#if data.html.ingredients}<section><h2 class="text-2xl font-semibold">{t('products.ingredients')}</h2><div class="prose-md mt-3">{@html data.html.ingredients}</div></section>{/if}
		{#if data.html.howToUse}<section><h2 class="text-2xl font-semibold">{t('products.howToUse')}</h2><div class="prose-md mt-3">{@html data.html.howToUse}</div></section>{/if}
		{#if p.t.faqs?.length}
			<section>
				<h2 class="text-2xl font-semibold">{t('products.faqs')}</h2>
				<div class="mt-4 max-w-3xl divide-y divide-forest-700/20 border-y border-forest-700/20">
					{#each p.t.faqs as f (f.q)}
						<details class="group py-1">
							<summary class="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-medium">{f.q}</summary>
							<p class="pb-4 text-stone-600">{f.a}</p>
						</details>
					{/each}
				</div>
			</section>
		{/if}
		{#if p.t.regulatoryText}<p class="max-w-prose whitespace-pre-line text-sm text-stone-600">{p.t.regulatoryText}</p>{/if}
	</div>

	{#if data.related.length}
		<section class="mt-20">
			<h2 class="text-2xl font-semibold">{t('products.related')}</h2>
			<ul class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each data.related as r (r.id)}<li><ProductCard lang={data.lang} product={r} /></li>{/each}
			</ul>
		</section>
	{/if}
</div>
```

- [ ] **Step 4: News list and detail**

`news/+page.server.ts`:

```ts
import { db } from '$lib/server/db/instance';
import { getNewsPage } from '$lib/server/content';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params, url }) => ({
	...getNewsPage(db, params.lang as Lang, Number(url.searchParams.get('page')) || 1, 9)
});
```

`news/+page.svelte`:

```svelte
<script lang="ts">
	import { formatDate } from '$lib/format';
	import { useT } from '$lib/i18n/context';
	import Img from '$lib/components/ui/Img.svelte';
	let { data } = $props();
	const t = useT();
	const [featured, ...rest] = $derived(data.items);
</script>

<svelte:head><title>{t('news.title')}</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
	<h1 class="font-serif text-4xl text-forest-700 sm:text-5xl">{t('news.title')}</h1>
	{#if !data.items.length}<p class="mt-8 text-stone-600">{t('common.empty')}</p>{/if}
	{#if featured}
		<a href="/{data.lang}/news/{featured.slug}" class="group mt-10 grid gap-6 lg:grid-cols-2">
			<Img src={featured.coverImage} alt={featured.t.coverAlt ?? featured.t.title} class="aspect-[16/10] w-full rounded-md object-cover" />
			<div class="self-center">
				<p class="text-sm text-stone-600">{formatDate(featured.eventDate, data.lang)}{featured.location ? `, ${featured.location}` : ''}</p>
				<h2 class="mt-1 font-serif text-3xl text-forest-700 group-hover:underline">{featured.t.title}</h2>
				{#if featured.t.excerpt}<p class="mt-3 text-stone-600">{featured.t.excerpt}</p>{/if}
			</div>
		</a>
	{/if}
	<ul class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
		{#each rest as n (n.id)}
			<li>
				<a href="/{data.lang}/news/{n.slug}" class="group block">
					<Img src={n.coverImage} alt={n.t.coverAlt ?? n.t.title} class="aspect-[16/10] w-full rounded-md object-cover" />
					<p class="mt-3 text-sm text-stone-600">{formatDate(n.eventDate, data.lang)}</p>
					<h2 class="font-serif text-xl text-forest-700 group-hover:underline">{n.t.title}</h2>
				</a>
			</li>
		{/each}
	</ul>
	{#if data.pages > 1}
		<nav class="mt-12 flex items-center justify-between" aria-label="Pagination">
			{#if data.page > 1}<a class="inline-flex min-h-11 items-center underline" href="?page={data.page - 1}">{t('common.prevPage')}</a>{:else}<span></span>{/if}
			<span class="text-sm text-stone-600">{data.page} / {data.pages}</span>
			{#if data.page < data.pages}<a class="inline-flex min-h-11 items-center underline" href="?page={data.page + 1}">{t('common.nextPage')}</a>{:else}<span></span>{/if}
		</nav>
	{/if}
</div>
```

`news/[slug]/+page.server.ts`:

```ts
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { getNewsBySlug } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const r = getNewsBySlug(db, params.lang as Lang, params.slug);
	if (!r) throw error(404);
	return { ...r, html: renderMarkdown(r.item.t.bodyMd) };
};
```

`news/[slug]/+page.svelte`:

```svelte
<script lang="ts">
	import { formatDate } from '$lib/format';
	import { useT } from '$lib/i18n/context';
	import Img from '$lib/components/ui/Img.svelte';
	let { data } = $props();
	const t = useT();
	const n = $derived(data.item);
</script>

<svelte:head><title>{n.t.title}</title>{#if n.t.excerpt}<meta name="description" content={n.t.excerpt} />{/if}</svelte:head>

<article class="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
	<a href="/{data.lang}/news" class="inline-flex min-h-11 items-center text-sm underline">{t('news.back')}</a>
	<h1 class="mt-2 font-serif text-4xl text-forest-700 sm:text-5xl">{n.t.title}</h1>
	<p class="mt-3 text-stone-600">{formatDate(n.eventDate, data.lang)}{n.location ? `, ${n.location}` : ''}</p>
	<Img src={n.coverImage} alt={n.t.coverAlt ?? n.t.title} loading="eager" class="mt-8 aspect-[16/9] w-full rounded-md object-cover" />
	<div class="prose-md mt-8">{@html data.html}</div>
	<nav class="mt-12 flex flex-wrap justify-between gap-4 border-t border-forest-700/20 pt-6" aria-label="Articles">
		{#if data.prev}<a class="inline-flex min-h-11 items-center underline" href="/{data.lang}/news/{data.prev.slug}">{t('news.prev')}: {data.prev.t.title}</a>{:else}<span></span>{/if}
		{#if data.next}<a class="inline-flex min-h-11 items-center underline" href="/{data.lang}/news/{data.next.slug}">{t('news.next')}: {data.next.t.title}</a>{/if}
	</nav>
</article>
```

(`prev` is the newer article, `next` the older, matching the list order newest first.)

- [ ] **Step 5: Testimonials, accolades, about pages**

`testimonials/+page.server.ts`:

```ts
import { db } from '$lib/server/db/instance';
import { getTestimonials } from '$lib/server/content';
import { youtubeId } from '$lib/youtube';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => ({
	items: getTestimonials(db, params.lang as Lang).map((x) => ({ ...x, videoId: youtubeId(x.youtubeUrl) })).filter((x) => x.videoId)
});
```

`testimonials/+page.svelte`:

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import YouTubeEmbed from '$lib/components/site/YouTubeEmbed.svelte';
	let { data } = $props();
	const t = useT();
</script>

<svelte:head><title>{t('testimonials.title')}</title></svelte:head>

<div class="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
	<h1 class="font-serif text-4xl text-forest-700 sm:text-5xl">{t('testimonials.title')}</h1>
	{#if !data.items.length}<p class="mt-8 text-stone-600">{t('common.empty')}</p>{/if}
	<ul class="mt-10 space-y-14">
		{#each data.items as x (x.id)}
			<li>
				<YouTubeEmbed videoId={x.videoId} title={x.t.title} poster={x.posterImage} />
				<h2 class="mt-4 text-xl font-semibold">{x.t.title}</h2>
				{#if x.t.quote}<p class="mt-2 font-serif text-xl">{x.t.quote}</p>{/if}
				{#if x.personName}<p class="mt-1 text-sm text-stone-600">{x.personName}{x.role ? `, ${x.role}` : ''}</p>{/if}
			</li>
		{/each}
	</ul>
</div>
```

`accolades/+page.server.ts`:

```ts
import { db } from '$lib/server/db/instance';
import { getAccolades } from '$lib/server/content';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => ({ items: getAccolades(db, params.lang as Lang) });
```

`accolades/+page.svelte`:

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import Accolades from '$lib/components/site/Accolades.svelte';
	let { data } = $props();
	const t = useT();
</script>

<svelte:head><title>{t('accolades.title')}</title></svelte:head>

<div class="pt-16">
	{#if data.items.length}
		<Accolades lang={data.lang} items={data.items} expanded />
	{:else}
		<p class="px-4 pt-16 text-stone-600 sm:px-6">{t('common.empty')}</p>
	{/if}
</div>
```

`about/+page.server.ts`:

```ts
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { getSettings } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const s = getSettings(db, params.lang as Lang);
	const md = s?.t?.aboutMd ?? s?.t?.aboutTeaserMd;
	if (!md) throw error(404);
	return { html: renderMarkdown(md) };
};
```

`about/+page.svelte`:

```svelte
<script lang="ts">
	import { useT } from '$lib/i18n/context';
	let { data } = $props();
	const t = useT();
</script>

<svelte:head><title>{t('about.title')}</title></svelte:head>

<div class="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
	<h1 class="font-serif text-4xl text-forest-700 sm:text-5xl">{t('about.title')}</h1>
	<div class="prose-md mt-8">{@html data.html}</div>
</div>
```

- [ ] **Step 6: Update spec 12.2 wording**

In `docs/superpowers/specs/2026-10-11-nutric-cms-design.md` replace "Below: tabs for Description, Ingredients, How to use (each tab hidden if empty), then related products from the same collection" with "Below: stacked sections for Description, Ingredients, How to use, FAQs (each hidden if empty), the regulatory text, then related products from the same collection".

- [ ] **Step 7: Verify in the browser**

Run `npm run dev`. Visit, in `/en` and `/ms`: `/products`, `/products/revolutic-biospray` (use the slug the seed produced; list them with `/products`), `/collections/revolutic`, `/news`, `/news/<slug>`, `/accolades`, `/about`, `/testimonials`, `/en/products/does-not-exist` (404 page). Check FAQ accordions open with keyboard, prev/next news links work, no console errors, 360 px has no horizontal scroll.

- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat: product, collection, news, testimonial, accolade and about pages" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`

---

### Task 13: Admin generic CRUD

**Files:**
- Create: `src/lib/server/entities.ts`, `src/lib/server/entity-form.ts`, `src/lib/server/entity-crud.ts`, `src/lib/server/entity-actions.ts`, extend `src/lib/server/upload.ts`, `src/lib/components/admin/{EntityList,EntityForm,LanguageTabs,ImageField,MarkdownField,Toast}.svelte`, `src/routes/admin/+layout.svelte`, `src/routes/admin/logout/+page.server.ts`, `src/routes/admin/preview/+server.ts`, `src/routes/admin/[entity=entity]/+page.server.ts`, `src/routes/admin/[entity=entity]/+page.svelte`, `src/routes/admin/[entity=entity]/[id]/+page.server.ts`, `src/routes/admin/[entity=entity]/[id]/+page.svelte`
- Test: `src/lib/server/entity-form.test.ts`, `src/lib/server/entity-crud.test.ts`, extend `src/lib/server/upload.test.ts`

**Interfaces:**
- Consumes: schema, `Db`, `slugify`, `youtubeId`, `enabledLangs`, `ensureSections`, `resolveUploadPath`.
- Produces:
  - `ENTITIES: Record<EntityKey, Entity>`, `getEntity(key: string): Entity | null`, `clientEntity(e: Entity)`
  - `parseFaqs(text: string): { q: string; a: string }[]`, `faqsToText(faqs): string`, `parseLines(text: string): string[]`
  - `readForm(entity: Entity, fd: FormData): { parsed: ParsedForm; files: Record<string, File[]> }`
  - `validateForm(entity: Entity, parsed: ParsedForm): FormErrors` (keys `f.<name>` and `t.<lang>.<name>`)
  - `saveEntity(db, entity, id: number | null, parsed: ParsedForm): number`, `loadEntity`, `listEntities`, `deleteEntity`, `toggleField`, `relationOptions`
  - `validateUpload(file: { name: string; size: number }, bytes: Uint8Array): { ext: 'jpg' | 'png' | 'webp' } | { error: string }`, `saveUpload(file: File, folder: string, root: string): Promise<string>` (returns `/uploads/<folder>/<uuid>.<ext>`; throws `UploadError`)
  - `saveFromForm(db, entity, id, fd, uploadRoot): Promise<{ ok: true; id: number } | { ok: false; errors: FormErrors; initial: FormValues }>`

- [ ] **Step 1: Write failing tests for form parsing and upload validation**

`src/lib/server/entity-form.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ENTITIES } from './entities';
import { faqsToText, parseFaqs, parseLines, readForm, validateForm } from './entity-form';

describe('parseFaqs / faqsToText', () => {
	it('parses blank-line separated blocks, first line is the question', () => {
		expect(parseFaqs('What?\nAnswer line 1\nline 2\n\nWhy?\nBecause')).toEqual([
			{ q: 'What?', a: 'Answer line 1\nline 2' },
			{ q: 'Why?', a: 'Because' }
		]);
	});
	it('ignores blocks without an answer and empty input', () => {
		expect(parseFaqs('Only a question')).toEqual([]);
		expect(parseFaqs('')).toEqual([]);
	});
	it('round-trips', () => {
		const faqs = [{ q: 'A?', a: 'B' }, { q: 'C?', a: 'D\nE' }];
		expect(parseFaqs(faqsToText(faqs))).toEqual(faqs);
	});
});

describe('parseLines', () => {
	it('splits, trims and drops blanks', () => expect(parseLines(' a \n\n b\r\nc ')).toEqual(['a', 'b', 'c']));
});

function fd(entries: [string, string][]): FormData {
	const f = new FormData();
	for (const [k, v] of entries) f.append(k, v);
	return f;
}

describe('readForm and validateForm (products)', () => {
	const e = ENTITIES.products;
	it('reads base and translated fields and coerces types', () => {
		const { parsed } = readForm(e, fd([
			['f.isPublished', 'on'], ['f.sortOrder', '3'], ['f.collectionId', ''],
			['t.en.name', ' BioSpray '], ['t.en.benefits', 'One\nTwo'], ['t.zh.name', '']
		]));
		expect(parsed.base.isPublished).toBe(true);
		expect(parsed.base.isBestSeller).toBe(false);
		expect(parsed.base.sortOrder).toBe(3);
		expect(parsed.base.collectionId).toBeNull();
		expect(parsed.trs.en?.name).toBe('BioSpray');
		expect(parsed.trs.en?.benefits).toEqual(['One', 'Two']);
	});
	it('requires the English name', () => {
		const { parsed } = readForm(e, fd([['t.en.name', '']]));
		expect(validateForm(e, parsed)['t.en.name']).toBeTruthy();
	});
	it('requires the name in another language once any field of it is filled', () => {
		const { parsed } = readForm(e, fd([['t.en.name', 'A'], ['t.th.shortDescription', 'only a description']]));
		expect(validateForm(e, parsed)['t.th.name']).toBeTruthy();
	});
	it('accepts a complete minimal form', () => {
		const { parsed } = readForm(e, fd([['t.en.name', 'A']]));
		expect(validateForm(e, parsed)).toEqual({});
	});
	it('rejects an image path that is not under /uploads/', () => {
		const { parsed } = readForm(e, fd([['t.en.name', 'A'], ['f.mainImage', 'https://evil.example/x.png']]));
		expect(parsed.base.mainImage).toBeNull();
	});
});

describe('testimonials', () => {
	const e = ENTITIES.testimonials;
	it('requires a valid YouTube URL', () => {
		const bad = readForm(e, fd([['t.en.title', 'T'], ['f.youtubeUrl', 'https://vimeo.com/1']])).parsed;
		expect(validateForm(e, bad)['f.youtubeUrl']).toBeTruthy();
		const ok = readForm(e, fd([['t.en.title', 'T'], ['f.youtubeUrl', 'https://youtu.be/dQw4w9WgXcQ']])).parsed;
		expect(validateForm(e, ok)).toEqual({});
	});
});

describe('news', () => {
	const e = ENTITIES.news;
	it('rejects a malformed date and an unknown status', () => {
		const p = readForm(e, fd([['t.en.title', 'T'], ['f.eventDate', '03/11/2017'], ['f.status', 'hacked']])).parsed;
		const errs = validateForm(e, p);
		expect(errs['f.eventDate']).toBeTruthy();
		expect(errs['f.status']).toBeTruthy();
	});
});
```

Extend `src/lib/server/upload.test.ts` (append):

```ts
import { validateUpload } from './upload';

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

describe('validateUpload', () => {
	it('accepts png, jpg and webp by magic bytes, ignoring the file name', () => {
		expect(validateUpload({ name: 'x.txt', size: 10 }, png)).toEqual({ ext: 'png' });
		expect(validateUpload({ name: 'x.png', size: 10 }, jpg)).toEqual({ ext: 'jpg' });
		expect(validateUpload({ name: 'x', size: 10 }, webp)).toEqual({ ext: 'webp' });
	});
	it('rejects a spoofed extension (html content named .jpg)', () => {
		const html = new TextEncoder().encode('<html><script>alert(1)</script>');
		expect(validateUpload({ name: 'evil.jpg', size: html.length }, html)).toHaveProperty('error');
	});
	it('rejects svg and empty files', () => {
		expect(validateUpload({ name: 'a.svg', size: 5 }, new TextEncoder().encode('<svg/>'))).toHaveProperty('error');
		expect(validateUpload({ name: 'a.png', size: 0 }, new Uint8Array())).toHaveProperty('error');
	});
	it('rejects files over 5 MB', () => {
		expect(validateUpload({ name: 'a.png', size: 5 * 1024 * 1024 + 1 }, png)).toHaveProperty('error');
	});
});
```

`src/lib/server/entity-crud.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import * as s from './db/schema';
import { ENTITIES } from './entities';
import { deleteEntity, listEntities, loadEntity, saveEntity, toggleField } from './entity-crud';

let db: Db;
beforeEach(() => (db = createDb(':memory:')));

const news = ENTITIES.news;
const parsed = (title: string, extra: Record<string, unknown> = {}) => ({
	base: { status: 'draft', eventDate: null, location: null, coverImage: null, ...extra },
	trs: { en: { title } as Record<string, unknown> }
});

describe('saveEntity', () => {
	it('creates a row with a slug from the English title and its translation', () => {
		const id = saveEntity(db, news, null, parsed('Hello World'));
		expect(db.select().from(s.news).get()?.slug).toBe('hello-world');
		expect(loadEntity(db, news, id)?.trs.en.title).toBe('Hello World');
	});
	it('gives unique slugs for equal titles', () => {
		saveEntity(db, news, null, parsed('Same'));
		saveEntity(db, news, null, parsed('Same'));
		expect(db.select().from(s.news).all().map((r) => r.slug).sort()).toEqual(['same', 'same-2']);
	});
	it('gives a non-empty unique slug for titles without Latin letters', () => {
		saveEntity(db, news, null, parsed('金士力佳友'));
		saveEntity(db, news, null, parsed('น้ำท่วม'));
		const slugs = db.select().from(s.news).all().map((r) => r.slug);
		expect(slugs.every((x) => x.length > 0)).toBe(true);
		expect(new Set(slugs).size).toBe(2);
	});
	it('keeps the slug on update and replaces translations', () => {
		const id = saveEntity(db, news, null, parsed('First'));
		saveEntity(db, news, id, { base: { status: 'published' }, trs: { en: { title: 'Renamed' }, zh: { title: '改名' } } });
		expect(db.select().from(s.news).get()?.slug).toBe('first');
		expect(db.select().from(s.newsTranslations).all()).toHaveLength(2);
		saveEntity(db, news, id, { base: {}, trs: { en: { title: 'Renamed' } } });
		expect(db.select().from(s.newsTranslations).all()).toHaveLength(1);
	});
});

describe('list, toggle, delete', () => {
	it('lists with the English title and filters by search text', () => {
		saveEntity(db, news, null, parsed('Alpha'));
		saveEntity(db, news, null, parsed('Beta'));
		expect(listEntities(db, news, '').map((r) => r.title).sort()).toEqual(['Alpha', 'Beta']);
		expect(listEntities(db, news, 'alp').map((r) => r.title)).toEqual(['Alpha']);
	});
	it('toggles publish state', () => {
		const id = saveEntity(db, news, null, parsed('A'));
		toggleField(db, news, id, 'status');
		expect(db.select().from(s.news).get()?.status).toBe('published');
		toggleField(db, news, id, 'status');
		expect(db.select().from(s.news).get()?.status).toBe('draft');
	});
	it('refuses to toggle a field that is not toggleable', () => {
		const id = saveEntity(db, news, null, parsed('A'));
		expect(() => toggleField(db, news, id, 'slug')).toThrow();
	});
	it('deletes the row and its translations', () => {
		const id = saveEntity(db, news, null, parsed('A'));
		deleteEntity(db, news, id);
		expect(db.select().from(s.news).all()).toHaveLength(0);
		expect(db.select().from(s.newsTranslations).all()).toHaveLength(0);
	});
});
```

- [ ] **Step 2: Run, see them fail.**

- [ ] **Step 3: Implement `entities.ts`**

```ts
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
			{ name: 'bannerImage', label: 'Banner image', type: 'image' }, sortOrder,
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
```

- [ ] **Step 4: Implement `entity-form.ts`**

```ts
import { enabledLangs, type Lang } from '../i18n/config';
import { youtubeId } from '../youtube';
import type { Entity, Field } from './entities';

export type ParsedForm = { base: Record<string, unknown>; trs: Partial<Record<Lang, Record<string, unknown>>> };
export type FormErrors = Record<string, string>;
export type FormValues = { base: Record<string, unknown>; trs: Record<string, Record<string, unknown>> };

export function parseLines(text: string): string[] {
	return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}
export function parseFaqs(text: string): { q: string; a: string }[] {
	return text
		.replace(/\r/g, '')
		.split(/\n\s*\n/)
		.map((block) => block.trim().split('\n'))
		.filter((lines) => lines.length >= 2 && lines[0].trim() && lines.slice(1).join('\n').trim())
		.map((lines) => ({ q: lines[0].trim(), a: lines.slice(1).join('\n').trim() }));
}
export const faqsToText = (faqs: { q: string; a: string }[]) => faqs.map((f) => `${f.q}\n${f.a}`).join('\n\n');

const text = (v: FormDataEntryValue | null): string | null => {
	const s = typeof v === 'string' ? v.trim() : '';
	return s === '' ? null : s;
};
const uploadPath = (v: string | null) => (v && v.startsWith('/uploads/') && !v.includes('..') ? v : null);

function coerce(field: Field, key: string, fd: FormData): unknown {
	switch (field.type) {
		case 'boolean': return fd.get(key) === 'on';
		case 'number': { const t = text(fd.get(key)); return t == null ? (field.name === 'sortOrder' ? 0 : null) : Number(t); }
		case 'select': return text(fd.get(key)) ?? field.options?.[0]?.value ?? null;
		case 'relation': { const t = text(fd.get(key)); return t == null ? null : Number(t); }
		case 'lines': return parseLines(String(fd.get(key) ?? ''));
		case 'faqs': return parseFaqs(String(fd.get(key) ?? ''));
		case 'image': return uploadPath(text(fd.get(key)));
		case 'imageList': return fd.getAll(key).map((x) => uploadPath(text(x))).filter((x): x is string => !!x);
		default: return text(fd.get(key));
	}
}

const hasContent = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '' && v !== false);

export function readForm(entity: Entity, fd: FormData) {
	const parsed: ParsedForm = { base: {}, trs: {} };
	const files: Record<string, File[]> = {};
	for (const f of entity.fields) {
		if (f.translatable) {
			for (const lang of enabledLangs()) {
				(parsed.trs[lang] ??= {})[f.name] = coerce(f, `t.${lang}.${f.name}`, fd);
			}
		} else {
			parsed.base[f.name] = coerce(f, `f.${f.name}`, fd);
			if (f.type === 'image' || f.type === 'imageList') {
				files[f.name] = fd.getAll(`file.${f.name}`).filter((x): x is File => x instanceof File && x.size > 0);
			}
		}
	}
	return { parsed, files };
}

export function validateForm(entity: Entity, parsed: ParsedForm): FormErrors {
	const errors: FormErrors = {};
	for (const f of entity.fields.filter((x) => !x.translatable)) {
		const v = parsed.base[f.name];
		if (f.required && !hasContent(v) && f.type !== 'image' && f.type !== 'imageList') errors[`f.${f.name}`] = `${f.label} is required.`;
		if (f.type === 'number' && v != null && !Number.isFinite(v as number)) errors[`f.${f.name}`] = `${f.label} must be a number.`;
		if (f.type === 'date' && v != null && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) errors[`f.${f.name}`] = `${f.label} must be a date (YYYY-MM-DD).`;
		if (f.type === 'select' && v != null && !f.options?.some((o) => o.value === v)) errors[`f.${f.name}`] = `${f.label} has an invalid value.`;
		if (f.type === 'url' && f.name === 'youtubeUrl' && v != null && !youtubeId(String(v))) errors[`f.${f.name}`] = 'Enter a YouTube video link (youtube.com/watch?v=..., youtu.be/..., or /embed/...).';
	}
	const required = entity.fields.filter((f) => f.translatable && f.required);
	for (const lang of enabledLangs()) {
		const tr = parsed.trs[lang] ?? {};
		const used = Object.values(tr).some(hasContent);
		if (lang !== 'en' && !used) continue;
		for (const f of required) {
			if (!hasContent(tr[f.name])) {
				errors[`t.${lang}.${f.name}`] = lang === 'en' ? `${f.label} is required in English.` : `${f.label} is required when this language is used.`;
			}
		}
	}
	return errors;
}

export function toFormValues(entity: Entity, rec: { base: Record<string, any>; trs: Record<string, Record<string, any>> }): FormValues {
	const out: FormValues = { base: { ...rec.base }, trs: {} };
	for (const [lang, tr] of Object.entries(rec.trs)) {
		out.trs[lang] = { ...tr };
		for (const f of entity.fields) {
			if (!f.translatable) continue;
			const v = tr[f.name];
			if (f.type === 'lines' && Array.isArray(v)) out.trs[lang][f.name] = v.join('\n');
			if (f.type === 'faqs' && Array.isArray(v)) out.trs[lang][f.name] = faqsToText(v);
		}
	}
	return out;
}
```

- [ ] **Step 5: Implement the upload half of `upload.ts`**

Append to `src/lib/server/upload.ts`:

```ts
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export class UploadError extends Error {}

export function validateUpload(
	file: { name: string; size: number },
	bytes: Uint8Array
): { ext: 'jpg' | 'png' | 'webp' } | { error: string } {
	if (file.size === 0 || bytes.length === 0) return { error: 'The file is empty.' };
	if (file.size > MAX_UPLOAD_BYTES) return { error: 'The file is larger than 5 MB.' };
	const b = bytes;
	if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg' };
	if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: 'png' };
	if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return { ext: 'webp' };
	return { error: 'Only JPG, PNG or WebP images are allowed.' };
}

export async function saveUpload(file: File, folder: string, root: string): Promise<string> {
	if (!/^[a-z]+$/.test(folder)) throw new UploadError('Invalid upload folder.');
	const bytes = new Uint8Array(await file.arrayBuffer());
	const checked = validateUpload({ name: file.name, size: file.size }, bytes);
	if ('error' in checked) throw new UploadError(checked.error);
	const name = `${randomUUID()}.${checked.ext}`;
	await mkdir(join(root, folder), { recursive: true });
	await writeFile(join(root, folder, name), bytes);
	return `/uploads/${folder}/${name}`;
}
```

- [ ] **Step 6: Implement `entity-crud.ts`**

```ts
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';
import { enabledLangs, type Lang } from '../i18n/config';
import { slugify } from '../slug';
import type { Entity } from './entities';
import type { ParsedForm } from './entity-form';

const nowSec = () => Math.floor(Date.now() / 1000);
const hasContent = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '' && v !== false);

function uniqueSlug(db: Db, entity: Entity, wanted: string): string {
	let slug = wanted;
	for (let n = 2; db.select().from(entity.table).where(eq(entity.table.slug, slug)).get(); n++) slug = `${wanted}-${n}`;
	return slug;
}

export function saveEntity(db: Db, entity: Entity, id: number | null, parsed: ParsedForm): number {
	return db.transaction((tx) => {
		const baseFields = entity.fields.filter((f) => !f.translatable).map((f) => f.name);
		const values: Record<string, unknown> = {};
		for (const name of baseFields) if (name in parsed.base) values[name] = parsed.base[name];
		let rowId = id;
		if (rowId == null) {
			if (entity.slugFrom) {
				const title = String(parsed.trs.en?.[entity.slugFrom] ?? '');
				values.slug = uniqueSlug(db, entity, slugify(title, `${entity.key}-${Date.now()}`));
			}
			rowId = (tx.insert(entity.table).values(values).returning({ id: entity.table.id }).get() as { id: number }).id;
		} else if ('updatedAt' in entity.table) {
			tx.update(entity.table).set({ ...values, updatedAt: nowSec() }).where(eq(entity.table.id, rowId)).run();
		} else {
			tx.update(entity.table).set(values).where(eq(entity.table.id, rowId)).run();
		}
		for (const lang of enabledLangs()) {
			const data = parsed.trs[lang];
			tx.delete(entity.trTable).where(and(eq(entity.trTable[entity.fk], rowId), eq(entity.trTable.lang, lang))).run();
			if (data && Object.values(data).some(hasContent)) {
				tx.insert(entity.trTable).values({ ...data, [entity.fk]: rowId, lang }).run();
			}
		}
		return rowId;
	});
}

export function loadEntity(db: Db, entity: Entity, id: number) {
	const base = db.select().from(entity.table).where(eq(entity.table.id, id)).get() as Record<string, any> | undefined;
	if (!base) return null;
	const rows = db.select().from(entity.trTable).where(eq(entity.trTable[entity.fk], id)).all() as Record<string, any>[];
	const trs: Record<string, Record<string, any>> = {};
	for (const r of rows) trs[r.lang] = r;
	return { base, trs };
}

export function listEntities(db: Db, entity: Entity, q: string) {
	const order = entity.order === 'date'
		? [desc(entity.table.eventDate), desc(entity.table.id)]
		: [asc(entity.table.sortOrder), asc(entity.table.id)];
	const bases = db.select().from(entity.table).orderBy(...order).all() as Record<string, any>[];
	const trs = bases.length
		? (db.select().from(entity.trTable).where(inArray(entity.trTable[entity.fk], bases.map((b) => b.id))).all() as Record<string, any>[])
		: [];
	const rows = bases.map((b) => {
		const mine = trs.filter((t) => t[entity.fk] === b.id);
		const title = (mine.find((t) => t.lang === 'en') ?? mine[0])?.[entity.titleField] ?? '(untitled)';
		const have = new Set(mine.map((t) => t.lang as Lang));
		return {
			id: b.id as number,
			title: String(title),
			thumb: entity.imageField ? ((b[entity.imageField] as string | null) ?? null) : null,
			published: entity.publish ? b[entity.publish.name] === entity.publish.on : null,
			bestSeller: 'isBestSeller' in b ? Boolean(b.isBestSeller) : null,
			sortOrder: (b.sortOrder as number | undefined) ?? null,
			missing: enabledLangs().filter((l) => !have.has(l))
		};
	});
	const needle = q.trim().toLowerCase();
	return needle ? rows.filter((r) => r.title.toLowerCase().includes(needle)) : rows;
}

export function deleteEntity(db: Db, entity: Entity, id: number): void {
	db.delete(entity.table).where(eq(entity.table.id, id)).run();
}

export function toggleField(db: Db, entity: Entity, id: number, field: string): void {
	const allowed = new Set<string>(['isBestSeller']);
	if (entity.publish) allowed.add(entity.publish.name);
	if (!allowed.has(field) || !entity.fields.some((f) => f.name === field)) throw new Error(`Field ${field} cannot be toggled`);
	const row = db.select().from(entity.table).where(eq(entity.table.id, id)).get() as Record<string, any> | undefined;
	if (!row) throw new Error('Not found');
	let next: unknown;
	if (entity.publish && field === entity.publish.name) next = row[field] === entity.publish.on ? entity.publish.off : entity.publish.on;
	else next = !row[field];
	db.update(entity.table).set({ [field]: next }).where(eq(entity.table.id, id)).run();
}

export function relationOptions(db: Db, entity: Entity): Record<string, { value: string; label: string }[]> {
	const out: Record<string, { value: string; label: string }[]> = {};
	if (entity.fields.some((f) => f.relation === 'collections')) {
		const cols = db.select().from(s.collections).orderBy(asc(s.collections.sortOrder)).all();
		const trs = db.select().from(s.collectionTranslations).all();
		out.collections = cols.map((c) => ({
			value: String(c.id),
			label: (trs.find((t) => t.collectionId === c.id && t.lang === 'en') ?? trs.find((t) => t.collectionId === c.id))?.name ?? c.slug
		}));
	}
	return out;
}
```

- [ ] **Step 7: Run all Task 13 server tests** — `npx vitest run src/lib/server`. Expected: pass. If the in-memory `toggleField` test on `'slug'` does not throw, check the `allowed` set logic.

- [ ] **Step 8: Implement `entity-actions.ts`**

```ts
import type { Db } from './db';
import type { Entity } from './entities';
import { readForm, toFormValues, validateForm, type FormErrors, type FormValues } from './entity-form';
import { saveEntity } from './entity-crud';
import { saveUpload, UploadError } from './upload';

export async function saveFromForm(
	db: Db, entity: Entity, id: number | null, fd: FormData, uploadRoot: string
): Promise<{ ok: true; id: number } | { ok: false; errors: FormErrors; initial: FormValues }> {
	const { parsed, files } = readForm(entity, fd);
	const errors = validateForm(entity, parsed);

	for (const f of entity.fields.filter((x) => x.type === 'image' || x.type === 'imageList')) {
		const incoming = files[f.name] ?? [];
		if (!incoming.length) continue;
		try {
			const paths: string[] = [];
			for (const file of incoming) paths.push(await saveUpload(file, entity.key.replace(/[^a-z]/g, ''), uploadRoot));
			if (f.type === 'image') parsed.base[f.name] = paths[0];
			else parsed.base[f.name] = [...((parsed.base[f.name] as string[]) ?? []), ...paths];
		} catch (e) {
			errors[`f.${f.name}`] = e instanceof UploadError ? e.message : 'The upload failed.';
		}
	}
	for (const f of entity.fields.filter((x) => x.type === 'image' && x.required)) {
		if (!parsed.base[f.name]) errors[`f.${f.name}`] = `${f.label} is required.`;
	}

	if (Object.keys(errors).length) return { ok: false, errors, initial: toFormValues(entity, parsed as any) };
	return { ok: true, id: saveEntity(db, entity, id, parsed) };
}
```

- [ ] **Step 9: Write the admin routes**

`src/routes/admin/logout/+page.server.ts`:

```ts
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { deleteSession } from '$lib/server/auth';

export const load = () => { throw redirect(303, '/admin'); };
export const actions = {
	default: ({ cookies }) => {
		const token = cookies.get('session');
		if (token) deleteSession(db, token);
		cookies.delete('session', { path: '/' });
		throw redirect(303, '/admin/login');
	}
};
```

`src/routes/admin/preview/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import { renderMarkdown } from '$lib/server/markdown';

export const POST = async ({ request }) => json({ html: renderMarkdown(String((await request.json()).md ?? '').slice(0, 100_000)) });
```

`src/routes/admin/[entity=entity]/+page.server.ts`:

```ts
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/instance';
import { clientEntity, getEntity } from '$lib/server/entities';
import { deleteEntity, listEntities, toggleField } from '$lib/server/entity-crud';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
	const e = getEntity(params.entity);
	if (!e) throw error(404);
	return { entity: clientEntity(e), rows: listEntities(db, e, url.searchParams.get('q') ?? ''), q: url.searchParams.get('q') ?? '', saved: url.searchParams.get('saved') === '1' };
};

export const actions: Actions = {
	toggle: async ({ request, params }) => {
		const e = getEntity(params.entity)!;
		const fd = await request.formData();
		try { toggleField(db, e, Number(fd.get('id')), String(fd.get('field'))); } catch { return fail(400, { error: 'Could not update.' }); }
	},
	delete: async ({ request, params }) => {
		const e = getEntity(params.entity)!;
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'Invalid item.' });
		deleteEntity(db, e, id);
	}
};
```

`src/routes/admin/[entity=entity]/[id]/+page.server.ts`:

```ts
import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/instance';
import { clientEntity, getEntity } from '$lib/server/entities';
import { loadEntity, relationOptions } from '$lib/server/entity-crud';
import { saveFromForm } from '$lib/server/entity-actions';
import { toFormValues } from '$lib/server/entity-form';
import { LANGUAGES } from '$lib/i18n/config';
import type { Actions, PageServerLoad } from './$types';

const parseId = (raw: string) => (raw === 'new' ? null : Number.isInteger(Number(raw)) ? Number(raw) : undefined);

export const load: PageServerLoad = ({ params }) => {
	const e = getEntity(params.entity);
	const id = parseId(params.id);
	if (!e || id === undefined) throw error(404);
	let rec = { base: {} as Record<string, any>, trs: {} as Record<string, Record<string, any>> };
	if (id !== null) {
		const found = loadEntity(db, e, id);
		if (!found) throw error(404);
		rec = found;
	} else {
		for (const f of e.fields) if (!f.translatable && f.type === 'boolean') rec.base[f.name] = f.name === 'isPublished';
	}
	return { entity: clientEntity(e), id, initial: toFormValues(e, rec), relations: relationOptions(db, e), languages: LANGUAGES.filter((l) => l.enabled) };
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const e = getEntity(params.entity)!;
		const id = parseId(params.id);
		if (id === undefined) throw error(404);
		const res = await saveFromForm(db, e, id, await request.formData(), env.UPLOAD_DIR ?? 'data/uploads');
		if (!res.ok) return fail(400, { errors: res.errors, initial: res.initial });
		throw redirect(303, `/admin/${e.key}?saved=1`);
	}
};
```

`src/routes/admin/+layout.svelte`:

```svelte
<script lang="ts">
	let { data, children } = $props();
	const links = [
		['/admin', 'Dashboard'], ['/admin/products', 'Products'], ['/admin/collections', 'Collections'], ['/admin/news', 'News'],
		['/admin/testimonials', 'Testimonials'], ['/admin/accolades', 'Accolades'], ['/admin/sections', 'Landing sections'],
		['/admin/settings', 'Settings'], ['/admin/subscribers', 'Subscribers'], ['/admin/account', 'Account']
	];
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>

{#if data.user}
	<div class="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
		<aside class="on-dark bg-forest-900 p-4 text-cream-100">
			<p class="px-3 py-2 font-serif text-xl">Admin</p>
			<nav aria-label="Admin" class="mt-2 flex flex-wrap gap-1 lg:flex-col">
				{#each links as [href, label] (href)}
					<a {href} class="flex min-h-11 items-center rounded-sm px-3 text-sm hover:bg-cream-100/10">{label}</a>
				{/each}
			</nav>
			<form method="post" action="/admin/logout" class="mt-4">
				<button class="min-h-11 w-full rounded-sm border border-cream-100/40 px-3 text-left text-sm">Sign out ({data.user.email})</button>
			</form>
		</aside>
		<div class="p-4 sm:p-8">{@render children()}</div>
	</div>
{:else}
	{@render children()}
{/if}
```

- [ ] **Step 10: Write the admin components**

`Toast.svelte`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	let { message }: { message: string } = $props();
	let visible = $state(true);
	onMount(() => { const id = setTimeout(() => (visible = false), 4000); return () => clearTimeout(id); });
</script>

{#if visible}
	<p role="status" class="fixed bottom-6 right-6 z-50 rounded-md bg-forest-700 px-5 py-3 text-cream-100 shadow-xl">{message}</p>
{/if}
```

`ImageField.svelte`:

```svelte
<script lang="ts">
	let { name, label, value, multiple = false, error, help }: {
		name: string; label: string; value: string | string[] | null; multiple?: boolean; error?: string; help?: string;
	} = $props();
	let kept = $state<string[]>(Array.isArray(value) ? [...value] : value ? [value] : []);
</script>

<fieldset class="space-y-2">
	<legend class="text-sm font-medium">{label}</legend>
	{#if help}<p class="text-sm text-stone-600">{help}</p>{/if}
	<ul class="flex flex-wrap gap-3">
		{#each kept as src (src)}
			<li class="w-28">
				<img {src} alt="" class="aspect-square w-full rounded-sm bg-white object-contain" />
				<input type="hidden" name="f.{name}" value={src} />
				<button type="button" class="mt-1 min-h-11 w-full text-sm underline" onclick={() => (kept = kept.filter((k) => k !== src))}>Remove</button>
			</li>
		{/each}
	</ul>
	<input type="file" name="file.{name}" accept="image/jpeg,image/png,image/webp" {multiple} class="block text-sm" aria-describedby={error ? `${name}-err` : undefined} />
	<p class="text-xs text-stone-600">JPG, PNG or WebP, up to 5 MB.</p>
	{#if error}<p id="{name}-err" role="alert" class="text-sm text-red-800">{error}</p>{/if}
</fieldset>
```

(For a single image, uploading a new file replaces the kept one on the server because the new path overwrites `parsed.base[name]`.)

`MarkdownField.svelte`:

```svelte
<script lang="ts">
	let { name, label, value = $bindable(''), error }: { name: string; label: string; value: string; error?: string } = $props();
	let preview = $state(false);
	let html = $state('');
	async function toggle() {
		preview = !preview;
		if (preview) {
			const res = await fetch('/admin/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ md: value }) });
			html = (await res.json()).html;
		}
	}
</script>

<div>
	<div class="flex items-center justify-between">
		<label for={name} class="text-sm font-medium">{label}</label>
		<button type="button" onclick={toggle} class="min-h-11 text-sm underline">{preview ? 'Edit' : 'Preview'}</button>
	</div>
	<textarea id={name} {name} rows="8" bind:value hidden={preview} class="mt-1 w-full rounded-sm border border-stone-600 bg-white p-3 font-mono text-sm"></textarea>
	{#if preview}<div class="prose-md mt-1 rounded-sm border border-stone-600/40 bg-white p-4">{@html html}</div>{/if}
	{#if error}<p role="alert" class="text-sm text-red-800">{error}</p>{/if}
</div>
```

`LanguageTabs.svelte`:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { languages, complete, children, active = $bindable('en') }: {
		languages: { code: string; label: string }[]; complete: Record<string, boolean>; children: Snippet<[string]>; active?: string;
	} = $props();
</script>

<div>
	<div role="tablist" aria-label="Language" class="flex flex-wrap gap-1 border-b border-forest-700/30">
		{#each languages as l (l.code)}
			<button type="button" role="tab" id="tab-{l.code}" aria-selected={active === l.code} aria-controls="panel-{l.code}" onclick={() => (active = l.code)}
				class="flex min-h-11 items-center gap-2 rounded-t-sm px-4 text-sm {active === l.code ? 'bg-forest-700 text-cream-100' : 'hover:bg-forest-700/10'}">
				<span aria-hidden="true" class="size-2 rounded-full {complete[l.code] ? 'bg-lime-400 ring-1 ring-forest-900' : 'ring-1 ring-current'}"></span>
				{l.label}
				<span class="sr-only">{complete[l.code] ? '(complete)' : '(missing)'}</span>
			</button>
		{/each}
	</div>
	{#each languages as l (l.code)}
		<div role="tabpanel" id="panel-{l.code}" aria-labelledby="tab-{l.code}" hidden={active !== l.code} class="space-y-5 pt-6">
			{@render children(l.code)}
		</div>
	{/each}
</div>
```

`EntityForm.svelte`:

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageField from './ImageField.svelte';
	import MarkdownField from './MarkdownField.svelte';
	import LanguageTabs from './LanguageTabs.svelte';

	let { entity, initial, errors = {}, relations, languages }: {
		entity: any; initial: { base: Record<string, any>; trs: Record<string, Record<string, any>> };
		errors?: Record<string, string>; relations: Record<string, { value: string; label: string }[]>; languages: { code: string; label: string }[];
	} = $props();

	const baseFields = $derived(entity.fields.filter((f: any) => !f.translatable));
	const trFields = $derived(entity.fields.filter((f: any) => f.translatable));
	let busy = $state(false);
	const tv: Record<string, Record<string, any>> = $state(
		Object.fromEntries(languages.map((l) => [l.code, Object.fromEntries(entity.fields.filter((f: any) => f.translatable).map((f: any) => [f.name, initial.trs[l.code]?.[f.name] ?? '']))]))
	);
	const complete = $derived(Object.fromEntries(languages.map((l) => [l.code,
		trFields.filter((f: any) => f.required).every((f: any) => String(tv[l.code][f.name] ?? '').trim() !== '')
		&& trFields.some((f: any) => String(tv[l.code][f.name] ?? '').trim() !== '')])));
	const input = 'mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2';
</script>

<form method="post" action="?/save" enctype="multipart/form-data" class="max-w-3xl space-y-6"
	use:enhance={() => { busy = true; return async ({ update }) => { await update({ reset: false }); busy = false; }; }}>
	{#if Object.keys(errors).length}
		<div role="alert" class="rounded-sm border border-red-800 bg-red-50 p-3 text-sm text-red-900">Please fix {Object.keys(errors).length} field(s) below.</div>
	{/if}

	{#each baseFields as f (f.name)}
		{#if f.type === 'image' || f.type === 'imageList'}
			<ImageField name={f.name} label={f.label} value={initial.base[f.name] ?? null} multiple={f.type === 'imageList'} error={errors[`f.${f.name}`]} help={f.help} />
		{:else if f.type === 'boolean'}
			<label class="flex min-h-11 items-center gap-3 text-sm">
				<input type="checkbox" name="f.{f.name}" checked={!!initial.base[f.name]} class="size-5" /> {f.label}
				{#if f.help}<span class="text-stone-600">({f.help})</span>{/if}
			</label>
		{:else}
			<div>
				<label for="f-{f.name}" class="text-sm font-medium">{f.label}{f.required ? ' *' : ''}</label>
				{#if f.type === 'select'}
					<select id="f-{f.name}" name="f.{f.name}" class={input}>
						{#each f.options as o (o.value)}<option value={o.value} selected={initial.base[f.name] === o.value}>{o.label}</option>{/each}
					</select>
				{:else if f.type === 'relation'}
					<select id="f-{f.name}" name="f.{f.name}" class={input}>
						<option value="">None</option>
						{#each relations[f.relation] ?? [] as o (o.value)}<option value={o.value} selected={String(initial.base[f.name]) === o.value}>{o.label}</option>{/each}
					</select>
				{:else}
					<input id="f-{f.name}" name="f.{f.name}" class={input}
						type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'}
						value={initial.base[f.name] ?? ''} />
				{/if}
				{#if f.help && f.type !== 'boolean'}<p class="mt-1 text-xs text-stone-600">{f.help}</p>{/if}
				{#if errors[`f.${f.name}`]}<p role="alert" class="text-sm text-red-800">{errors[`f.${f.name}`]}</p>{/if}
			</div>
		{/if}
	{/each}

	<LanguageTabs {languages} {complete}>
		{#snippet children(code)}
			{#each trFields as f (f.name)}
				{@const key = `t.${code}.${f.name}`}
				{#if f.type === 'markdown'}
					<MarkdownField name={key} label={f.label} bind:value={tv[code][f.name]} error={errors[key]} />
				{:else}
					<div>
						<label for={key} class="text-sm font-medium">{f.label}{f.required && code === 'en' ? ' *' : ''}</label>
						{#if f.type === 'text'}
							<input id={key} name={key} bind:value={tv[code][f.name]} class={input} />
						{:else}
							<textarea id={key} name={key} rows={f.type === 'faqs' ? 8 : 4} bind:value={tv[code][f.name]} class={input}></textarea>
						{/if}
						{#if f.help}<p class="mt-1 text-xs text-stone-600">{f.help}</p>{/if}
						{#if errors[key]}<p role="alert" class="text-sm text-red-800">{errors[key]}</p>{/if}
					</div>
				{/if}
			{/each}
		{/snippet}
	</LanguageTabs>

	<div class="flex gap-3">
		<button disabled={busy} class="min-h-12 rounded-sm bg-forest-700 px-6 text-cream-100 disabled:opacity-60">{busy ? 'Saving' : 'Save'}</button>
		<a href="/admin/{entity.key}" class="inline-flex min-h-12 items-center px-4 underline">Cancel</a>
	</div>
</form>
```

`EntityList.svelte`:

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Toast from './Toast.svelte';
	let { entity, rows, q, saved }: { entity: any; rows: any[]; q: string; saved: boolean } = $props();
	let confirmRow: any = $state(null);
	let open = $state(false);
	function ask(row: any) { confirmRow = row; open = true; }
</script>

{#if saved}<Toast message="Saved." />{/if}

<div class="flex flex-wrap items-center justify-between gap-4">
	<h1 class="font-serif text-3xl text-forest-700">{entity.label}</h1>
	<a href="/admin/{entity.key}/new" class="inline-flex min-h-12 items-center rounded-sm bg-forest-700 px-5 text-cream-100">Add {entity.singular}</a>
</div>

<form method="get" class="mt-6 max-w-sm">
	<label for="q" class="text-sm">Search</label>
	<input id="q" name="q" value={q} class="mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2" />
</form>

{#if !rows.length}
	<p class="mt-10 text-stone-600">{q ? `No ${entity.label.toLowerCase()} match "${q}".` : `No ${entity.label.toLowerCase()} yet.`} <a class="underline" href="/admin/{entity.key}/new">Add the first {entity.singular}</a>.</p>
{:else}
	<div class="mt-6 overflow-x-auto">
		<table class="w-full min-w-[40rem] text-left text-sm">
			<thead><tr class="border-b border-forest-700/30"><th class="p-2">Image</th><th class="p-2">Name</th><th class="p-2">Status</th><th class="p-2">Order</th><th class="p-2">Missing</th><th class="p-2"><span class="sr-only">Actions</span></th></tr></thead>
			<tbody>
				{#each rows as r (r.id)}
					<tr class="border-b border-forest-700/15">
						<td class="p-2">{#if r.thumb}<img src={r.thumb} alt="" class="size-12 rounded-sm bg-white object-contain" />{/if}</td>
						<td class="p-2"><a class="font-medium underline" href="/admin/{entity.key}/{r.id}">{r.title}</a></td>
						<td class="p-2">
							{#if r.published !== null}
								<form method="post" action="?/toggle" use:enhance class="inline">
									<input type="hidden" name="id" value={r.id} /><input type="hidden" name="field" value={entity.publish.name} />
									<button class="min-h-11 rounded-sm border border-forest-700/40 px-3">{r.published ? 'Published' : 'Draft'}</button>
								</form>
							{/if}
							{#if r.bestSeller !== null}
								<form method="post" action="?/toggle" use:enhance class="inline">
									<input type="hidden" name="id" value={r.id} /><input type="hidden" name="field" value="isBestSeller" />
									<button aria-pressed={r.bestSeller} class="min-h-11 rounded-sm border border-forest-700/40 px-3">{r.bestSeller ? 'Best seller' : 'Not best seller'}</button>
								</form>
							{/if}
						</td>
						<td class="p-2">{r.sortOrder ?? ''}</td>
						<td class="p-2 text-xs text-stone-600">{r.missing.join(', ')}</td>
						<td class="p-2 text-right"><button class="min-h-11 px-3 text-red-800 underline" onclick={() => ask(r)}>Delete</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<Dialog bind:open label="Confirm delete">
	{#if confirmRow}
		<h2 class="font-serif text-2xl">Delete "{confirmRow.title}"?</h2>
		<p class="mt-2 text-stone-600">This removes it and all its translations. This cannot be undone.</p>
		<form method="post" action="?/delete" use:enhance={() => async ({ update }) => { await update(); open = false; }} class="mt-6 flex gap-3">
			<input type="hidden" name="id" value={confirmRow.id} />
			<button class="min-h-12 rounded-sm bg-red-800 px-5 text-white">Delete</button>
			<button type="button" class="min-h-12 px-4 underline" onclick={() => (open = false)}>Cancel</button>
		</form>
	{/if}
</Dialog>
```

`src/routes/admin/[entity=entity]/+page.svelte`:

```svelte
<script lang="ts">
	import EntityList from '$lib/components/admin/EntityList.svelte';
	let { data } = $props();
</script>
<svelte:head><title>{data.entity.label} | Admin</title></svelte:head>
<EntityList entity={data.entity} rows={data.rows} q={data.q} saved={data.saved} />
```

`src/routes/admin/[entity=entity]/[id]/+page.svelte`:

```svelte
<script lang="ts">
	import EntityForm from '$lib/components/admin/EntityForm.svelte';
	let { data, form } = $props();
</script>
<svelte:head><title>{data.id === null ? 'Add' : 'Edit'} {data.entity.singular} | Admin</title></svelte:head>
<h1 class="mb-6 font-serif text-3xl text-forest-700">{data.id === null ? 'Add' : 'Edit'} {data.entity.singular}</h1>
{#key form?.initial ?? data.initial}
	<EntityForm entity={data.entity} initial={form?.initial ?? data.initial} errors={form?.errors ?? {}} relations={data.relations} languages={data.languages} />
{/key}
```

- [ ] **Step 11: Verify in the browser**

Run `npm run dev`; sign in at `/admin/login` with the `.env` credentials. Check: Products list shows 12 rows with thumbnails and best-seller toggle (BioSpray on); search filters; toggling Published flips the label and the product disappears from `/en/products`; open a product, edit the Malay name, Save, see the toast on the list and the change on `/ms/products/...`; Add news item with only English title → appears at `/en/news` after setting Status to Published; saving with an empty English title shows the inline error and keeps your typed values; upload a `.txt` renamed `.jpg` → "Only JPG, PNG or WebP images are allowed."; delete shows the confirm dialog, Escape closes it; no console errors.

- [ ] **Step 12: Commit** — `git add -A && git commit -m "feat: generic admin CRUD for products, collections, news, testimonials, accolades" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`

---

### Task 14: Admin dashboard, sections, settings, subscribers, account

**Files:**
- Create: `src/lib/server/settings-form.ts`, `src/routes/admin/+page.server.ts`, `src/routes/admin/+page.svelte`, `src/routes/admin/sections/+page.server.ts`, `src/routes/admin/sections/+page.svelte`, `src/routes/admin/settings/+page.server.ts`, `src/routes/admin/settings/+page.svelte`, `src/routes/admin/subscribers/+page.server.ts`, `src/routes/admin/subscribers/+page.svelte`, `src/routes/admin/subscribers/export/+server.ts`, `src/routes/admin/account/+page.server.ts`, `src/routes/admin/account/+page.svelte`
- Test: `src/lib/server/settings-form.test.ts`, `src/lib/server/admin-misc.test.ts`

**Interfaces:**
- Consumes: schema, `validateTheme`, `ensureSections`, `SECTION_KEYS`, `hashPassword`/`verifyPassword`, `readForm`-style helpers.
- Produces:
  - `parseSocialLinks(text: string): { platform: string; url: string }[]`, `socialLinksToText(list): string`
  - `readSettingsForm(fd: FormData): { base: SettingsBase; trs: Record<Lang, SettingsTr>; themeInput: unknown }`
  - `validateSettings(parsed): { errors: Record<string, string>; theme: Theme | null }`
  - `reorderSections(db, orderedKeys: string[], enabled: Set<string>): void`
  - `csvEscape(cell: string): string` (neutralises formula injection)
  - `changePassword(db, userId: number, current: string, next: string): Promise<'ok' | 'wrong-current' | 'too-short'>`

- [ ] **Step 1: Write failing tests**

`src/lib/server/settings-form.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseSocialLinks, readSettingsForm, socialLinksToText, validateSettings } from './settings-form';
import { DEFAULT_THEME } from '../theme/tokens';

describe('social links', () => {
	it('parses platform|url lines and keeps only https URLs', () => {
		expect(parseSocialLinks('facebook|https://fb.com/x\nbad|javascript:alert(1)\ninstagram | https://ig.com/y\n\nnourl')).toEqual([
			{ platform: 'facebook', url: 'https://fb.com/x' },
			{ platform: 'instagram', url: 'https://ig.com/y' }
		]);
	});
	it('round-trips', () => {
		const list = [{ platform: 'youtube', url: 'https://youtube.com/c/x' }];
		expect(parseSocialLinks(socialLinksToText(list))).toEqual(list);
	});
});

function fd(entries: [string, string][]) {
	const f = new FormData();
	for (const [k, v] of entries) f.append(k, v);
	return f;
}
const colorEntries = Object.entries(DEFAULT_THEME.colors).map(([k, v]) => [`theme.${k}`, v] as [string, string]);

describe('validateSettings', () => {
	const ok: [string, string][] = [['f.brandName', 'Nutric'], ['theme.radiusSm', '4'], ['theme.radiusMd', '12'], ['theme.fontSans', 'Poppins'], ['theme.fontSerif', 'Fraunces'], ...colorEntries];
	it('accepts valid settings', () => {
		const r = validateSettings(readSettingsForm(fd(ok)));
		expect(r.errors).toEqual({});
		expect(r.theme).not.toBeNull();
	});
	it('requires a brand name', () => {
		const r = validateSettings(readSettingsForm(fd(ok.map(([k, v]) => (k === 'f.brandName' ? [k, ''] : [k, v])) as [string, string][])));
		expect(r.errors['f.brandName']).toBeTruthy();
	});
	it('names the failing contrast pair', () => {
		const bad = ok.map(([k, v]) => (k === 'theme.stone600' ? [k, '#e0ddd0'] : [k, v])) as [string, string][];
		const r = validateSettings(readSettingsForm(fd(bad)));
		expect(r.errors.theme).toContain('stone600');
		expect(r.theme).toBeNull();
	});
	it('rejects a non-https WhatsApp link and a malformed email', () => {
		const r = validateSettings(readSettingsForm(fd([...ok, ['f.whatsappUrl', 'http://wa.me/1'], ['f.contactEmail', 'nope']])));
		expect(r.errors['f.whatsappUrl']).toBeTruthy();
		expect(r.errors['f.contactEmail']).toBeTruthy();
	});
});
```

`src/lib/server/admin-misc.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createDb } from './db';
import * as s from './db/schema';
import { createAdminUser, verifyPassword } from './auth';
import { changePassword, csvEscape, reorderSections } from './admin-misc';
import { ensureSections } from './sections';

describe('csvEscape', () => {
	it.each([
		['plain', 'plain'],
		['a,b', '"a,b"'],
		['say "hi"', '"say ""hi"""'],
		['=HYPERLINK("x")', `"'=HYPERLINK(""x"")"`],
		['+1', `'+1`],
		['-1', `'-1`],
		['@cmd', `'@cmd`]
	])('%s', (input, expected) => expect(csvEscape(input)).toBe(expected));
});

describe('reorderSections', () => {
	it('sets positions and enabled flags from the submitted order', () => {
		const db = createDb(':memory:');
		ensureSections(db);
		reorderSections(db, ['news', 'hero', 'newsletter', 'about', 'collections', 'best_seller', 'testimonials', 'accolades'], new Set(['news', 'hero', 'newsletter']));
		const rows = db.select().from(s.pageSections).all();
		expect(rows.find((r) => r.key === 'news')?.position).toBe(0);
		expect(rows.find((r) => r.key === 'about')?.isEnabled).toBe(false);
		expect(rows.find((r) => r.key === 'hero')?.isEnabled).toBe(true);
	});
	it('ignores unknown keys and keeps every section', () => {
		const db = createDb(':memory:');
		ensureSections(db);
		reorderSections(db, ['bogus', 'news'], new Set(['news']));
		expect(db.select().from(s.pageSections).all()).toHaveLength(8);
	});
});

describe('changePassword', () => {
	it('changes the password when the current one matches and the new one is long enough', async () => {
		const db = createDb(':memory:');
		await createAdminUser(db, 'a@b.co', 'old-password-123');
		expect(await changePassword(db, 1, 'old-password-123', 'new-password-456')).toBe('ok');
		const u = db.select().from(s.adminUsers).get()!;
		expect(await verifyPassword(u.passwordHash, 'new-password-456')).toBe(true);
	});
	it('rejects a wrong current password and a short new password', async () => {
		const db = createDb(':memory:');
		await createAdminUser(db, 'a@b.co', 'old-password-123');
		expect(await changePassword(db, 1, 'nope', 'new-password-456')).toBe('wrong-current');
		expect(await changePassword(db, 1, 'old-password-123', 'short')).toBe('too-short');
	});
});
```

- [ ] **Step 2: Run, see them fail.**

- [ ] **Step 3: Implement `admin-misc.ts` and `settings-form.ts`**

`src/lib/server/admin-misc.ts`:

```ts
import { eq, ne } from 'drizzle-orm';
import type { Db } from './db';
import * as s from './db/schema';
import { hashPassword, verifyPassword } from './auth';
import { SECTION_KEYS } from './sections';

export function csvEscape(cell: string): string {
	let v = cell;
	const formula = /^[=+\-@\t\r]/.test(v);
	if (formula) v = `'${v}`;
	return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function reorderSections(db: Db, orderedKeys: string[], enabled: Set<string>): void {
	const valid = orderedKeys.filter((k) => (SECTION_KEYS as readonly string[]).includes(k));
	const rest = SECTION_KEYS.filter((k) => !valid.includes(k));
	[...valid, ...rest].forEach((key, position) => {
		db.update(s.pageSections).set({ position, isEnabled: enabled.has(key) }).where(eq(s.pageSections.key, key)).run();
	});
}

export async function changePassword(db: Db, userId: number, current: string, next: string): Promise<'ok' | 'wrong-current' | 'too-short'> {
	const user = db.select().from(s.adminUsers).where(eq(s.adminUsers.id, userId)).get();
	if (!user || !(await verifyPassword(user.passwordHash, current))) return 'wrong-current';
	if (next.length < 12) return 'too-short';
	db.update(s.adminUsers).set({ passwordHash: await hashPassword(next) }).where(eq(s.adminUsers.id, userId)).run();
	return 'ok';
}
```

Note: `reorderSections` marks sections missing from `enabled` as disabled, so the sections form must submit a checkbox for every enabled key. Section keys left out of `orderedKeys` are appended at the end with their enabled flag taken from `enabled` (so an omitted key becomes disabled; the form always submits all 8).

`src/lib/server/settings-form.ts`:

```ts
import { enabledLangs, type Lang } from '../i18n/config';
import { COLOR_KEYS, validateTheme, type Theme } from '../theme/tokens';

export function parseSocialLinks(text: string): { platform: string; url: string }[] {
	return text.split(/\r?\n/).map((line) => line.split('|').map((x) => x.trim()))
		.filter(([platform, url]) => platform && url && /^https:\/\//.test(url))
		.map(([platform, url]) => ({ platform: platform.toLowerCase(), url }));
}
export const socialLinksToText = (list: { platform: string; url: string }[]) => list.map((l) => `${l.platform}|${l.url}`).join('\n');

const t = (fd: FormData, k: string) => {
	const v = String(fd.get(k) ?? '').trim();
	return v === '' ? null : v;
};
const TR_FIELDS = ['tagline', 'headlineLine1', 'headlineLine2', 'subheadline', 'ctaLabel', 'heroBadgeText', 'aboutTeaserMd', 'aboutMd', 'aboutImageAlt', 'footerNote'] as const;
export type SettingsTr = Record<(typeof TR_FIELDS)[number], string | null>;

export function readSettingsForm(fd: FormData) {
	const base = {
		brandName: t(fd, 'f.brandName'),
		contactEmail: t(fd, 'f.contactEmail'),
		contactPhone: t(fd, 'f.contactPhone'),
		whatsappUrl: t(fd, 'f.whatsappUrl'),
		heroMediaType: t(fd, 'f.heroMediaType') === 'video' ? ('video' as const) : ('image' as const),
		socialLinks: parseSocialLinks(String(fd.get('f.socialLinks') ?? '')),
		logoImage: t(fd, 'f.logoImage'),
		heroMedia: t(fd, 'f.heroMedia'),
		heroProductImage: t(fd, 'f.heroProductImage')
	};
	const trs = {} as Record<Lang, SettingsTr>;
	for (const lang of enabledLangs()) {
		trs[lang] = Object.fromEntries(TR_FIELDS.map((f) => [f, t(fd, `t.${lang}.${f}`)])) as SettingsTr;
	}
	const themeInput = {
		colors: Object.fromEntries(COLOR_KEYS.map((k) => [k, String(fd.get(`theme.${k}`) ?? '')])),
		fonts: { sans: String(fd.get('theme.fontSans') ?? ''), serif: String(fd.get('theme.fontSerif') ?? '') },
		radius: { sm: Number(fd.get('theme.radiusSm')), md: Number(fd.get('theme.radiusMd')) }
	};
	return { base, trs, themeInput };
}

export function validateSettings(p: ReturnType<typeof readSettingsForm>): { errors: Record<string, string>; theme: Theme | null } {
	const errors: Record<string, string> = {};
	if (!p.base.brandName) errors['f.brandName'] = 'Brand name is required.';
	if (p.base.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.base.contactEmail)) errors['f.contactEmail'] = 'Enter a valid email address.';
	if (p.base.whatsappUrl && !/^https:\/\//.test(p.base.whatsappUrl)) errors['f.whatsappUrl'] = 'The link must start with https://';
	const checked = validateTheme(p.themeInput);
	if (!checked.ok) {
		errors.theme = checked.errors.join(' ');
		return { errors, theme: null };
	}
	return { errors, theme: checked.theme };
}
```

- [ ] **Step 4: Run the tests** — `npx vitest run src/lib/server`. Expected: pass.

- [ ] **Step 5: Dashboard**

`src/routes/admin/+page.server.ts`:

```ts
import { count, eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';

export const load = () => {
	const n = (t: any) => (db.select({ c: count() }).from(t).get()?.c ?? 0);
	return {
		counts: { products: n(s.products), collections: n(s.collections), news: n(s.news), testimonials: n(s.testimonials), accolades: n(s.accolades), subscribers: n(s.subscribers) },
		drafts: db.select({ id: s.news.id, slug: s.news.slug }).from(s.news).where(eq(s.news.status, 'draft')).orderBy(desc(s.news.id)).limit(5).all()
	};
};
```

`src/routes/admin/+page.svelte`:

```svelte
<script lang="ts">
	let { data } = $props();
	const items = $derived([
		['products', 'Products', data.counts.products], ['collections', 'Collections', data.counts.collections], ['news', 'News', data.counts.news],
		['testimonials', 'Testimonials', data.counts.testimonials], ['accolades', 'Accolades', data.counts.accolades]
	] as [string, string, number][]);
</script>

<svelte:head><title>Dashboard | Admin</title></svelte:head>
<h1 class="font-serif text-3xl text-forest-700">Dashboard</h1>
<ul class="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each items as [key, label, n] (key)}
		<li>
			<a href="/admin/{key}" class="block rounded-md border border-forest-700/25 bg-white p-5">
				<span class="block text-3xl font-semibold text-forest-700">{n}</span>
				<span class="text-sm text-stone-600">{n === 0 ? `No ${label.toLowerCase()} yet. Add the first one` : label}</span>
			</a>
		</li>
	{/each}
	<li>
		<a href="/admin/subscribers" class="block rounded-md border border-forest-700/25 bg-white p-5">
			<span class="block text-3xl font-semibold text-forest-700">{data.counts.subscribers}</span>
			<span class="text-sm text-stone-600">Subscribers</span>
		</a>
	</li>
</ul>
{#if data.drafts.length}
	<h2 class="mt-10 text-lg font-semibold">News drafts</h2>
	<ul class="mt-2 list-disc pl-6">
		{#each data.drafts as d (d.id)}<li><a class="underline" href="/admin/news/{d.id}">{d.slug}</a></li>{/each}
	</ul>
{/if}
```

- [ ] **Step 6: Sections page (reorder and enable)**

`src/routes/admin/sections/+page.server.ts`:

```ts
import { asc } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { reorderSections } from '$lib/server/admin-misc';
import { ensureSections } from '$lib/server/sections';
import { getChrome } from '$lib/server/content';
import { redirect } from '@sveltejs/kit';

export const load = () => {
	ensureSections(db);
	const rows = db.select().from(s.pageSections).orderBy(asc(s.pageSections.position)).all();
	const visible = new Set(getChrome(db, 'en').visible);
	return { rows: rows.map((r) => ({ key: r.key, isEnabled: r.isEnabled, hasContent: visible.has(r.key as any) })) };
};

export const actions = {
	default: async ({ request }) => {
		const fd = await request.formData();
		reorderSections(db, fd.getAll('order').map(String), new Set(fd.getAll('enabled').map(String)));
		throw redirect(303, '/admin/sections');
	}
};
```

`src/routes/admin/sections/+page.svelte` (move up/down buttons, keyboard accessible, no drag):

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	let { data } = $props();
	let rows = $state(data.rows.map((r) => ({ ...r })));
	const labels: Record<string, string> = {
		hero: 'Hero', best_seller: 'Best seller', collections: 'Collections and products', about: 'About teaser',
		testimonials: 'Testimonials', accolades: 'Accolades', news: 'Latest news', newsletter: 'Newsletter'
	};
	function move(i: number, d: number) {
		const j = i + d;
		if (j < 0 || j >= rows.length) return;
		[rows[i], rows[j]] = [rows[j], rows[i]];
	}
</script>

<svelte:head><title>Landing sections | Admin</title></svelte:head>
<h1 class="font-serif text-3xl text-forest-700">Landing sections</h1>
<p class="mt-2 max-w-prose text-stone-600">Set the order and which sections appear. A section with no published content is hidden automatically, even when enabled.</p>
<form method="post" use:enhance class="mt-6 max-w-xl space-y-2">
	{#each rows as r, i (r.key)}
		<div class="flex items-center gap-3 rounded-md border border-forest-700/25 bg-white p-3">
			<input type="hidden" name="order" value={r.key} />
			<label class="flex min-h-11 flex-1 items-center gap-3">
				<input type="checkbox" name="enabled" value={r.key} bind:checked={r.isEnabled} class="size-5" />
				<span>{labels[r.key]}</span>
				{#if r.isEnabled && !r.hasContent}<span class="text-xs text-stone-600">(hidden: no content)</span>{/if}
			</label>
			<button type="button" class="size-11 rounded-sm border border-forest-700/40" aria-label="Move {labels[r.key]} up" onclick={() => move(i, -1)} disabled={i === 0}>&uarr;</button>
			<button type="button" class="size-11 rounded-sm border border-forest-700/40" aria-label="Move {labels[r.key]} down" onclick={() => move(i, 1)} disabled={i === rows.length - 1}>&darr;</button>
		</div>
	{/each}
	<button class="mt-4 min-h-12 rounded-sm bg-forest-700 px-6 text-cream-100">Save order</button>
</form>
```

- [ ] **Step 7: Settings page**

`src/routes/admin/settings/+page.server.ts`:

```ts
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { readSettingsForm, socialLinksToText, validateSettings } from '$lib/server/settings-form';
import { saveUpload, UploadError } from '$lib/server/upload';
import { DEFAULT_THEME } from '$lib/theme/tokens';
import { LANGUAGES, enabledLangs } from '$lib/i18n/config';

export const load = () => {
	const base = db.select().from(s.siteSettings).where(eq(s.siteSettings.id, 1)).get();
	const trs = Object.fromEntries(db.select().from(s.siteSettingsTranslations).all().map((r) => [r.lang, r]));
	return {
		base: base ? { ...base, socialLinks: socialLinksToText(base.socialLinks) } : null,
		trs, theme: base?.theme ?? DEFAULT_THEME, languages: LANGUAGES.filter((l) => l.enabled)
	};
};

export const actions = {
	save: async ({ request }) => {
		const fd = await request.formData();
		const parsed = readSettingsForm(fd);
		const { errors, theme } = validateSettings(parsed);
		for (const field of ['logoImage', 'heroMedia', 'heroProductImage'] as const) {
			const file = fd.get(`file.${field}`);
			if (file instanceof File && file.size > 0) {
				try { parsed.base[field] = await saveUpload(file, 'settings', env.UPLOAD_DIR ?? 'data/uploads'); }
				catch (e) { errors[`f.${field}`] = e instanceof UploadError ? e.message : 'The upload failed.'; }
			}
		}
		if (Object.keys(errors).length) return fail(400, { errors });
		db.transaction((tx) => {
			tx.insert(s.siteSettings).values({ id: 1, ...parsed.base, brandName: parsed.base.brandName!, theme })
				.onConflictDoUpdate({ target: s.siteSettings.id, set: { ...parsed.base, brandName: parsed.base.brandName!, theme, updatedAt: Math.floor(Date.now() / 1000) } }).run();
			for (const lang of enabledLangs()) {
				const tr = parsed.trs[lang];
				tx.delete(s.siteSettingsTranslations).where(eq(s.siteSettingsTranslations.lang, lang)).run();
				if (Object.values(tr).some((v) => v != null)) tx.insert(s.siteSettingsTranslations).values({ lang, ...tr }).run();
			}
		});
		return { saved: true };
	}
};
```

`src/routes/admin/settings/+page.svelte`:

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import LanguageTabs from '$lib/components/admin/LanguageTabs.svelte';
	import Toast from '$lib/components/admin/Toast.svelte';
	import { COLOR_KEYS } from '$lib/theme/tokens';

	let { data, form } = $props();
	const errors = $derived(form?.errors ?? {});
	const b = $derived(data.base);
	const input = 'mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2';
	const trFields: [string, string, boolean][] = [
		['tagline', 'Tagline', false], ['headlineLine1', 'Hero headline, left part', false], ['headlineLine2', 'Hero headline, right part', false],
		['subheadline', 'Hero subheadline', true], ['ctaLabel', 'Hero button label (leave empty for the default)', false],
		['heroBadgeText', 'Hero badge text (leave empty for no badge; only enter a claim you can document)', false],
		['aboutTeaserMd', 'About teaser (Markdown)', true], ['aboutMd', 'About page (Markdown)', true], ['aboutImageAlt', 'About image description', false], ['footerNote', 'Footer note', true]
	];
	const complete = $derived(Object.fromEntries(data.languages.map((l: any) => [l.code, !!data.trs[l.code]])));
</script>

<svelte:head><title>Settings | Admin</title></svelte:head>
{#if form?.saved}<Toast message="Settings saved." />{/if}
<h1 class="font-serif text-3xl text-forest-700">Settings</h1>

<form method="post" action="?/save" enctype="multipart/form-data" use:enhance={() => async ({ update }) => update({ reset: false })} class="mt-6 max-w-3xl space-y-8">
	{#if Object.keys(errors).length}<div role="alert" class="rounded-sm border border-red-800 bg-red-50 p-3 text-sm text-red-900">Please fix the highlighted fields.</div>{/if}

	<fieldset class="space-y-4"><legend class="text-xl font-semibold">Brand</legend>
		<div><label for="brandName" class="text-sm font-medium">Brand name *</label><input id="brandName" name="f.brandName" value={b?.brandName ?? ''} class={input} />{#if errors['f.brandName']}<p role="alert" class="text-sm text-red-800">{errors['f.brandName']}</p>{/if}</div>
		<ImageField name="logoImage" label="Logo" value={b?.logoImage ?? null} error={errors['f.logoImage']} />
	</fieldset>

	<fieldset class="space-y-4"><legend class="text-xl font-semibold">Contact and social</legend>
		<div><label for="contactEmail" class="text-sm font-medium">Contact email</label><input id="contactEmail" name="f.contactEmail" value={b?.contactEmail ?? ''} class={input} />{#if errors['f.contactEmail']}<p role="alert" class="text-sm text-red-800">{errors['f.contactEmail']}</p>{/if}</div>
		<div><label for="contactPhone" class="text-sm font-medium">Contact phone</label><input id="contactPhone" name="f.contactPhone" value={b?.contactPhone ?? ''} class={input} /></div>
		<div><label for="whatsappUrl" class="text-sm font-medium">WhatsApp link</label><input id="whatsappUrl" name="f.whatsappUrl" value={b?.whatsappUrl ?? ''} class={input} />{#if errors['f.whatsappUrl']}<p role="alert" class="text-sm text-red-800">{errors['f.whatsappUrl']}</p>{/if}<p class="mt-1 text-xs text-stone-600">The contact buttons use WhatsApp first, then email, then phone. None are shown if all are empty.</p></div>
		<div><label for="socialLinks" class="text-sm font-medium">Social links (one per line: platform|https://link)</label><textarea id="socialLinks" name="f.socialLinks" rows="4" class={input}>{b?.socialLinks ?? ''}</textarea></div>
	</fieldset>

	<fieldset class="space-y-4"><legend class="text-xl font-semibold">Hero media</legend>
		<ImageField name="heroMedia" label="Hero image or video (image: JPG, PNG, WebP)" value={b?.heroMedia ?? null} error={errors['f.heroMedia']} />
		<div><label for="heroMediaType" class="text-sm font-medium">Hero media type</label>
			<select id="heroMediaType" name="f.heroMediaType" class={input}><option value="image" selected={b?.heroMediaType === 'image'}>Image</option><option value="video" selected={b?.heroMediaType === 'video'}>Video (keep the existing video file)</option></select></div>
		<ImageField name="heroProductImage" label="Hero product image (overrides the best seller image)" value={b?.heroProductImage ?? null} error={errors['f.heroProductImage']} />
	</fieldset>

	<fieldset class="space-y-4"><legend class="text-xl font-semibold">Theme</legend>
		<p class="text-sm text-stone-600">Saving is refused if any text/background pair falls below its contrast requirement.</p>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each COLOR_KEYS as k (k)}
				<div><label for="c-{k}" class="text-sm font-medium">{k}</label>
					<input id="c-{k}" name="theme.{k}" type="color" value={data.theme.colors[k]} class="mt-1 h-11 w-full rounded-sm border border-stone-600" /></div>
			{/each}
			<div><label for="fs" class="text-sm font-medium">Interface font</label><select id="fs" name="theme.fontSans" class={input}>{#each ['Poppins', 'Fraunces'] as f (f)}<option selected={data.theme.fonts.sans === f}>{f}</option>{/each}</select></div>
			<div><label for="fr" class="text-sm font-medium">Product-name font</label><select id="fr" name="theme.fontSerif" class={input}>{#each ['Poppins', 'Fraunces'] as f (f)}<option selected={data.theme.fonts.serif === f}>{f}</option>{/each}</select></div>
			<div><label for="rs" class="text-sm font-medium">Small radius (px)</label><input id="rs" name="theme.radiusSm" type="number" min="0" max="16" value={data.theme.radius.sm} class={input} /></div>
			<div><label for="rm" class="text-sm font-medium">Medium radius (px)</label><input id="rm" name="theme.radiusMd" type="number" min="0" max="32" value={data.theme.radius.md} class={input} /></div>
		</div>
		{#if errors.theme}<p role="alert" class="text-sm text-red-800">{errors.theme}</p>{/if}
	</fieldset>

	<fieldset><legend class="mb-3 text-xl font-semibold">Texts by language</legend>
		<LanguageTabs languages={data.languages} {complete}>
			{#snippet children(code)}
				{#each trFields as [name, label, long] (name)}
					<div><label for="t-{code}-{name}" class="text-sm font-medium">{label}</label>
						{#if long}<textarea id="t-{code}-{name}" name="t.{code}.{name}" rows="4" class={input}>{data.trs[code]?.[name] ?? ''}</textarea>
						{:else}<input id="t-{code}-{name}" name="t.{code}.{name}" value={data.trs[code]?.[name] ?? ''} class={input} />{/if}</div>
				{/each}
			{/snippet}
		</LanguageTabs>
	</fieldset>

	<button class="min-h-12 rounded-sm bg-forest-700 px-6 text-cream-100">Save settings</button>
</form>
```

Note on hero video: the seed sets the hero to the scraped `home.mp4`. The settings form only uploads images; to keep a video hero, leave the hero media field untouched (its current path is kept in a hidden input) and keep the type on Video. Uploading a replacement video through the admin is out of scope.

- [ ] **Step 8: Subscribers and account**

`src/routes/admin/subscribers/+page.server.ts`:

```ts
import { desc } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';

export const load = () => ({ rows: db.select().from(s.subscribers).orderBy(desc(s.subscribers.id)).limit(500).all() });
```

`src/routes/admin/subscribers/+page.svelte`:

```svelte
<script lang="ts">
	let { data } = $props();
</script>
<svelte:head><title>Subscribers | Admin</title></svelte:head>
<div class="flex flex-wrap items-center justify-between gap-4">
	<h1 class="font-serif text-3xl text-forest-700">Subscribers</h1>
	{#if data.rows.length}<a href="/admin/subscribers/export" class="inline-flex min-h-12 items-center rounded-sm border border-forest-700 px-5">Export CSV</a>{/if}
</div>
{#if !data.rows.length}
	<p class="mt-8 text-stone-600">No subscribers yet. Addresses appear here when visitors use the newsletter form on the site.</p>
{:else}
	<table class="mt-6 w-full max-w-2xl text-left text-sm">
		<thead><tr class="border-b border-forest-700/30"><th class="p-2">Email</th><th class="p-2">Language</th><th class="p-2">Date</th></tr></thead>
		<tbody>{#each data.rows as r (r.id)}<tr class="border-b border-forest-700/15"><td class="p-2">{r.email}</td><td class="p-2">{r.lang}</td><td class="p-2">{new Date(r.createdAt * 1000).toISOString().slice(0, 10)}</td></tr>{/each}</tbody>
	</table>
{/if}
```

`src/routes/admin/subscribers/export/+server.ts`:

```ts
import { asc } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { csvEscape } from '$lib/server/admin-misc';

export const GET = () => {
	const rows = db.select().from(s.subscribers).orderBy(asc(s.subscribers.id)).all();
	const csv = ['email,language,date', ...rows.map((r) => [r.email, r.lang, new Date(r.createdAt * 1000).toISOString().slice(0, 10)].map(csvEscape).join(','))].join('\n');
	return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="subscribers.csv"' } });
};
```

`src/routes/admin/account/+page.server.ts`:

```ts
import { fail } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';
import { changePassword } from '$lib/server/admin-misc';

export const actions = {
	default: async ({ request, locals, cookies }) => {
		const fd = await request.formData();
		const next = String(fd.get('next') ?? '');
		if (next !== String(fd.get('confirm') ?? '')) return fail(400, { error: 'The new passwords do not match.' });
		const res = await changePassword(db, locals.user!.id, String(fd.get('current') ?? ''), next);
		if (res === 'wrong-current') return fail(400, { error: 'The current password is incorrect.' });
		if (res === 'too-short') return fail(400, { error: 'The new password must be at least 12 characters.' });
		const keep = cookies.get('session');
		if (keep) {
			const { createHash } = await import('node:crypto');
			db.delete(s.sessions).where(and(eq(s.sessions.userId, locals.user!.id), ne(s.sessions.id, createHash('sha256').update(keep).digest('hex')))).run();
		}
		return { saved: true };
	}
};
```

`src/routes/admin/account/+page.svelte`:

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import Toast from '$lib/components/admin/Toast.svelte';
	let { form } = $props();
	const input = 'mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2';
</script>
<svelte:head><title>Account | Admin</title></svelte:head>
{#if form?.saved}<Toast message="Password changed." />{/if}
<h1 class="font-serif text-3xl text-forest-700">Account</h1>
<form method="post" use:enhance class="mt-6 max-w-sm space-y-4">
	<label class="block text-sm">Current password<input name="current" type="password" required autocomplete="current-password" class={input} /></label>
	<label class="block text-sm">New password (12+ characters)<input name="next" type="password" required minlength="12" autocomplete="new-password" class={input} /></label>
	<label class="block text-sm">Repeat new password<input name="confirm" type="password" required autocomplete="new-password" class={input} /></label>
	{#if form?.error}<p role="alert" class="text-sm text-red-800">{form.error}</p>{/if}
	<button class="min-h-12 rounded-sm bg-forest-700 px-6 text-cream-100">Change password</button>
</form>
```

- [ ] **Step 9: Verify in the browser**

`npm run dev`, sign in. Check: Dashboard counts match the lists; Landing sections: move News to the top, uncheck About, Save, reload `/en` and see the order and the missing About; set the hero badge text and a headline in Settings, Save, see them on `/en`; set a theme color to a failing value (for example `stone600` to `#e0ddd0`) and see the refusal naming the pair; Subscribers shows the address from Task 11 and the CSV downloads; change password with a wrong current password shows the error. No console errors.

- [ ] **Step 10: Commit** — `git add -A && git commit -m "feat: admin dashboard, section ordering, settings, subscribers, account" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`

---

### Task 15: End-to-end, accessibility, overflow tests, README, final gate

**Files:**
- Create: `playwright.config.ts`, `e2e/helpers.ts`, `e2e/landing.spec.ts`, `e2e/admin.spec.ts`, `e2e/a11y.spec.ts`, `e2e/overflow.spec.ts`, `e2e/keyboard.spec.ts`, `e2e/hero-contrast.spec.ts`, `README.md`
- Modify: `.env.example` (add `NEWSLETTER_ENABLED=false`)

**Interfaces:**
- Consumes: the running built app seeded from `seed/data.json`.
- Produces: `npm run test:e2e` passing; the Delivery Gate report.

- [ ] **Step 1: `playwright.config.ts` and helpers**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	timeout: 60_000,
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'npm run build && npx tsx scripts/seed.ts --db data/e2e.db && node build',
		url: 'http://localhost:4173/en',
		timeout: 240_000,
		reuseExistingServer: false,
		env: {
			PORT: '4173', ORIGIN: 'http://localhost:4173',
			DATABASE_PATH: 'data/e2e.db', UPLOAD_DIR: 'data/e2e-uploads',
			ADMIN_EMAIL: 'e2e@example.com', ADMIN_PASSWORD: 'e2e-password-123456',
			NEWSLETTER_ENABLED: 'true'
		}
	}
});
```

`e2e/helpers.ts`:

```ts
import type { Page } from '@playwright/test';

export const LANGS = ['en', 'ms', 'id', 'zh', 'zh-tw', 'th'] as const;
export const ADMIN = { email: 'e2e@example.com', password: 'e2e-password-123456' };

export async function login(page: Page) {
	await page.goto('/admin/login');
	await page.getByLabel('Email').fill(ADMIN.email);
	await page.getByLabel('Password').fill(ADMIN.password);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL('/admin');
}

export function collectConsoleErrors(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	page.on('console', (m) => { if (m.type() === 'error' && !/youtube|ytimg|favicon/i.test(m.text())) errors.push(m.text()); });
	return errors;
}
```

- [ ] **Step 2: Landing, redirects, nav**

`e2e/landing.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { LANGS, collectConsoleErrors } from './helpers';

const HTML_LANG: Record<string, string> = { en: 'en', ms: 'ms', id: 'id', zh: 'zh-CN', 'zh-tw': 'zh-TW', th: 'th' };

for (const lang of LANGS) {
	test(`landing renders in ${lang}`, async ({ page }) => {
		const errors = collectConsoleErrors(page);
		await page.goto(`/${lang}`);
		await expect(page.locator('html')).toHaveAttribute('lang', HTML_LANG[lang]);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.locator('footer')).toBeVisible();
		expect(errors).toEqual([]);
	});

	test(`every nav link in ${lang} reaches a real page`, async ({ page, request }) => {
		await page.goto(`/${lang}`);
		const hrefs = await page.locator('header nav a').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!));
		expect(hrefs.length).toBeGreaterThan(0);
		for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
	});
}

test('unsupported language redirects to English keeping the path', async ({ page }) => {
	await page.goto('/xx/products');
	await expect(page).toHaveURL(/\/en\/products$/);
});

test('language-less path redirects by Accept-Language', async ({ browser }) => {
	const ctx = await browser.newContext({ locale: 'zh-TW', extraHTTPHeaders: { 'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8' } });
	const page = await ctx.newPage();
	await page.goto('/');
	await expect(page).toHaveURL(/\/zh-tw$/);
	await ctx.close();
});

test('an unknown path under a language is a 404, not a redirect loop', async ({ request }) => {
	const res = await request.get('/en/zzz', { maxRedirects: 0 });
	expect(res.status()).toBe(404);
});

test('unknown slug shows the translated 404 page', async ({ page }) => {
	const res = await page.goto('/ms/products/does-not-exist');
	expect(res?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'Halaman tidak ditemui' })).toBeVisible();
});

test('detail pages load', async ({ page }) => {
	await page.goto('/en/products');
	await page.locator('main a[href*="/en/products/"]').first().click();
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await page.goto('/en/news');
	await page.locator('main a[href*="/en/news/"]').first().click();
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('newsletter accepts an address, then reports a duplicate', async ({ page }) => {
	await page.goto('/en#newsletter');
	const email = `visitor-${Date.now()}@example.com`;
	await page.getByLabel('Email address').fill(email);
	await page.getByRole('button', { name: 'Subscribe to event updates' }).click();
	await expect(page.getByText('Thank you. You are subscribed.')).toBeVisible();
	await page.getByLabel('Email address').fill(email.toUpperCase());
	await page.getByRole('button', { name: 'Subscribe to event updates' }).click();
	await expect(page.getByText('This address is already subscribed.')).toBeVisible();
	await page.getByLabel('Email address').fill('not-an-email');
	await page.getByRole('button', { name: 'Subscribe to event updates' }).click();
	await expect(page.getByText('Enter a valid email address.')).toBeVisible();
});

test('uploads route blocks path traversal', async ({ request }) => {
	for (const p of ['/uploads/../package.json', '/uploads/%2e%2e/package.json', '/uploads/..%2fpackage.json']) {
		expect([400, 404], p).toContain((await request.get(p)).status());
	}
});
```

- [ ] **Step 3: Admin flow**

`e2e/admin.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { ADMIN, login } from './helpers';

test('admin redirects to login when signed out', async ({ page }) => {
	await page.goto('/admin/products');
	await expect(page).toHaveURL(/\/admin\/login$/);
});

test('wrong password shows an error and stays on login', async ({ page }) => {
	await page.goto('/admin/login');
	await page.getByLabel('Email').fill(ADMIN.email);
	await page.getByLabel('Password').fill('wrong-password-000');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert')).toContainText('incorrect');
});

test('admin creates a news item that appears on the site, then deletes it', async ({ page }) => {
	await login(page);
	const title = `E2E event ${Date.now()}`;
	await page.goto('/admin/news/new');
	await page.getByLabel('Status').selectOption('published');
	await page.locator('[id="t.en.title"]').fill(title);
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page).toHaveURL(/\/admin\/news\?saved=1/);
	await page.goto('/en/news');
	await expect(page.getByText(title).first()).toBeVisible();

	await page.goto('/admin/news');
	await page.getByRole('row', { name: new RegExp(title) }).getByRole('button', { name: 'Delete' }).click();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
	await page.getByRole('row', { name: new RegExp(title) }).getByRole('button', { name: 'Delete' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
	await page.goto('/en/news');
	await expect(page.getByText(title)).toHaveCount(0);
});

test('empty English title is refused and typed values are kept', async ({ page }) => {
	await login(page);
	await page.goto('/admin/news/new');
	await page.getByRole('tab', { name: /Bahasa Malaysia/ }).click();
	await page.locator('[id="t.ms.title"]').fill('Tajuk sahaja');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByRole('alert').first()).toBeVisible();
	await page.getByRole('tab', { name: /Bahasa Malaysia/ }).click();
	await expect(page.locator('[id="t.ms.title"]')).toHaveValue('Tajuk sahaja');
});

test('reordering sections changes the landing page', async ({ page }) => {
	await login(page);
	await page.goto('/admin/sections');
	for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Move Latest news up' }).click();
	await page.getByRole('button', { name: 'Save order' }).click();
	await page.goto('/en');
	const ids = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id));
	expect(ids[0]).toBe('news');
	// restore
	await page.goto('/admin/sections');
	for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Move Latest news down' }).click();
	await page.getByRole('button', { name: 'Save order' }).click();
	await page.goto('/en');
	const restored = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id));
	expect(restored[0]).toBe('hero');
});
```

- [ ] **Step 4: Accessibility, overflow, keyboard, hero contrast**

`e2e/a11y.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { login } from './helpers';

const PUBLIC = ['/en', '/en/products', '/en/news', '/en/about', '/en/accolades', '/zh/news', '/th/products'];

for (const path of PUBLIC) {
	test(`no serious axe violations on ${path}`, async ({ page }) => {
		await page.goto(path);
		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
		const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
		expect(bad.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
	});
}

test('product detail, news detail and admin have no serious axe violations', async ({ page }) => {
	const check = async (path: string) => {
		await page.goto(path);
		const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
		expect(r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${path} ${v.id}`)).toEqual([]);
	};
	await page.goto('/en/products');
	await check(await page.locator('main a[href*="/en/products/"]').first().getAttribute('href') as string);
	await page.goto('/en/news');
	await check(await page.locator('main a[href*="/en/news/"]').first().getAttribute('href') as string);
	await login(page);
	await check('/admin/products');
	await check('/admin/products/new');
	await check('/admin/settings');
});
```

`e2e/overflow.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { LANGS } from './helpers';

const ROUTES = ['', '/products', '/news', '/about', '/accolades', '/testimonials'];
const WIDTHS = [360, 768, 1280];

for (const lang of LANGS) {
	for (const width of WIDTHS) {
		test(`no horizontal overflow: ${lang} at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			for (const r of ROUTES) {
				await page.goto(`/${lang}${r}`);
				const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
				expect(over, `${lang}${r} @${width}`).toBeLessThanOrEqual(0);
			}
		});
	}
}
```

`e2e/keyboard.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('skip link is the first focus stop and every focused element shows a visible indicator', async ({ page }) => {
	await page.goto('/en');
	await page.keyboard.press('Tab');
	await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
	for (let i = 0; i < 12; i++) {
		await page.keyboard.press('Tab');
		const outline = await page.evaluate(() => {
			const el = document.activeElement as HTMLElement;
			const cs = getComputedStyle(el);
			return { w: parseFloat(cs.outlineWidth), style: cs.outlineStyle, tag: el.tagName };
		});
		expect(outline.style !== 'none' && outline.w >= 2, JSON.stringify(outline)).toBe(true);
	}
});

test('mobile menu opens and Escape closes it', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	await page.goto('/en');
	await page.getByRole('button', { name: 'Open menu' }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
});

test('reduced motion removes entrance transforms and pauses the hero video', async ({ browser }) => {
	const ctx = await browser.newContext({ reducedMotion: 'reduce' });
	const page = await ctx.newPage();
	await page.goto('/en');
	const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.hero-media')!).animationName);
	expect(anim).toBe('none');
	const paused = await page.evaluate(() => document.querySelector('video')?.paused ?? true);
	expect(paused).toBe(true);
	await ctx.close();
});
```

`e2e/hero-contrast.spec.ts` (samples the pixels under the headline against the text color):

```ts
import { expect, test } from '@playwright/test';
import { LANGS } from './helpers';

function lum(r: number, g: number, b: number) {
	const f = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
	return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

for (const lang of LANGS) {
	test(`hero text keeps contrast over the photo (${lang})`, async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto(`/${lang}`);
		await page.waitForTimeout(1500);
		const h1 = page.getByRole('heading', { level: 1 });
		await h1.evaluate((el) => ((el as HTMLElement).style.visibility = 'hidden'));
		const box = (await h1.boundingBox())!;
		const shot = await page.screenshot({ clip: box });
		await h1.evaluate((el) => ((el as HTMLElement).style.visibility = 'visible'));
		const png = await page.evaluate(async (b64) => {
			const img = new Image();
			img.src = 'data:image/png;base64,' + b64;
			await img.decode();
			const c = document.createElement('canvas');
			c.width = img.width; c.height = img.height;
			const ctx = c.getContext('2d')!;
			ctx.drawImage(img, 0, 0);
			const d = ctx.getImageData(0, 0, c.width, c.height).data;
			let lightest = 0;
			for (let i = 0; i < d.length; i += 4 * 17) lightest = Math.max(lightest, 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
			return lightest;
		}, shot.toString('base64'));
		// Text is cream (#F4F1E8, luminance about 0.88). The lightest background pixel under it must keep 3:1 (large text).
		const bg = lum(png, png, png);
		expect((0.88 + 0.05) / (bg + 0.05)).toBeGreaterThanOrEqual(3);
	});
}
```

- [ ] **Step 5: Run the whole suite**

```bash
npm test
npm run test:e2e
```

Expected: unit tests pass; e2e passes. Fix real defects the tests find (overflow in Thai/Indonesian strings, axe color-contrast on a component, missing labels) in the component, not in the test. If `hero-contrast` fails for a language, strengthen the scrim (`.hero-scrim` in `src/app.css`) rather than lowering the threshold.

- [ ] **Step 6: README and `.env.example`**

Add `NEWSLETTER_ENABLED=false` to `.env.example`. Create `README.md` with these sections (write them in full, no placeholders): what this is; requirements (Node 24); setup (`cp .env.example .env`, edit admin credentials, `npm install`, `npm run seed`, `npm run dev`); admin at `/admin` and what each page does; scripts table (`dev`, `build`, `test`, `test:e2e`, `scrape`, `seed`, `db:generate`); production notes (`npm run build && node build`, copy the `drizzle/` folder next to the build, set `DATABASE_PATH`, `UPLOAD_DIR`, `ORIGIN`, `NEWSLETTER_ENABLED=true` only after Terms and Privacy pages exist); content notes (the scraper stores source text verbatim; the six dictionaries other than English are machine-written drafts that need native-speaker review; expired advertisement approval text in `seed/REPORT.md`; the owner questions in spec section 16).

- [ ] **Step 7: Acceptance checklist and Delivery Gate (spec section 15, antislop R-35)**

Run the app (`npm run build && node build` with the e2e env, or `npm run dev`) and walk the checklist below with the browser tool at 360 px and 1280 px. Record each line with evidence in the commit message or a `docs/delivery-report.md`:

1. Click every nav item, button, link, form, dialog and toggle on the landing, a product page, a news page, and every admin page; note the observed result for each; console has no errors.
2. Six languages: landing, product detail and news detail at 360 px show no horizontal scroll and no clipped text (the overflow spec covers the routes; eyeball Thai and Chinese typography once).
3. Keyboard-only pass through landing and admin (the keyboard spec covers focus rings and the menu; also confirm the lightbox and delete dialog close with Escape).
4. axe: zero serious or critical (a11y spec).
5. Contrast: token test and hero spec green.
6. Reduced motion: keyboard spec green.
7. Empty states: stop the server, run `node -e "const D=require('better-sqlite3');const d=new D('data/e2e.db');d.exec('update products set is_published=0; update news set status=\'draft\'; update testimonials set is_published=0; update accolades set is_published=0; update site_settings_translations set about_teaser_md=null, about_md=null')"`, restart, open `/en`: only the hero (headline centered, no bottle, no CTA) and the newsletter/footer remain; the navbar has no content links; footer lists no section links.
8. Dials: sections visibly differ in composition (RHYTHM 3), motion is limited to the table in spec 11.6 (MOTION 2), lime appears only where spec 11.3 allows (ENERGY 2).
9. Content integrity: grep the rendered pages for any number, name, quote or claim not in `seed/data.json` or entered in the admin.

Then run the antislop Delivery Gate against the built UI, producing the PASS/FAIL report, and fix any FAIL before handing over.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "test: e2e, accessibility and overflow suites; README; delivery gate" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-review against the spec

**Spec coverage** (spec section, then the task that implements it):
- 1 Goal, success criteria: Tasks 9 to 12 (site), 13 to 14 (admin), 7 to 8 (content), 15 (verification).
- 2 Tech stack: Task 1.
- 3 Languages: Tasks 3, 6 (redirects), 9 (switcher, hreflang, `lang` attribute), 11 (per-element `lang` when a fallback is used, in `ProductCard`).
- 4 Routes: Tasks 9, 11, 12.
- 5 Data model: Task 2 (plus amendments in Task 0).
- 6 Admin: Tasks 6, 13, 14. Delete confirm, search, publish toggle, completeness dots, Markdown preview, upload limits, sessions, rate limit, CSV, password change are all present.
- 7 Seeding: Tasks 7 and 8. Spec asks for `seed/REPORT.md`: Task 7. Expired approval flagged: Task 7.
- 8 Error handling: Tasks 6, 9, 12 (404 pages), 13 (upload errors), markdown sanitising (Task 5).
- 9 Testing: Tasks 3 to 6, 8, 10, 13, 14 (Vitest), 15 (Playwright, axe, keyboard, overflow, reduced motion, hero contrast).
- 11 UI direction: Task 9 (tokens, fonts, radius scale, shadow, no glow), Task 11 (hero, glass card, CTA, motion), tokens contrast in Task 4.
- 12 Composition and navigation: Task 5 (`resolveVisibleSections`, `navItemsFor`), Tasks 11 and 12.
- 13 States: Newsletter states (Task 10), video states (Task 11), admin states (Task 13), empty landing (Tasks 5 and 15).
- 14 Generic architecture: registry (Task 13), theme in settings (Tasks 4, 9, 14), sections as data (Tasks 5, 14), language config (Task 3).
- 15 Acceptance checklist: Task 15 Step 7.

**Known deviations, all recorded above:** social links are text labels instead of brand glyphs; product detail uses stacked sections instead of tabs; no about-teaser photo (no `about_image` field exists in the data model, so none is invented); hero video upload through the admin is out of scope (the seeded video is kept); Mandarin/Thai/other dictionaries are drafts for native review.

**Type consistency check:** `Localized<B,T>` items expose `.t` and `.usedLang` everywhere they are used (`ProductCard`, `Hero`, `Accolades`, news components). `getChrome` returns `{ settings, visible, nav }` consumed by `[lang=lang]/+layout.server.ts`. `ENTITIES[...].fk` names (`productId`, `collectionId`, `newsId`, `testimonialId`, `accoladeId`) match the Drizzle column properties in `schema.ts`. Form key format `f.<name>` and `t.<lang>.<name>` is the same in `readForm`, `validateForm`, `EntityForm`, `ImageField`, `MarkdownField`, and the e2e selectors.

