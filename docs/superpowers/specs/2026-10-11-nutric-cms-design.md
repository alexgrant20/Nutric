# Nutric CMS — Design Spec

Date: 2026-10-11
Status: Draft for review

## 1. Goal

Rebuild the Nutric healthcare-products website (source: https://www.nutric.com/) as a modern single-landing-page site with detail pages, managed through a custom admin panel. Visual direction follows the "Verdare" reference: full-bleed nature hero, oversized headline split around a centered product shot, glass cards, circular "100% plant based" badge, lime CTA pill.

### Success criteria
- Landing page presents: hero, best-seller spotlight, product series + product list, about teaser, video testimonials, accolades/certificates, latest news, newsletter.
- Each landing section links to its own detail page.
- Separate News page for Nutric events, with detail pages.
- All content editable in `/admin` without touching code.
- 6 languages: English, Bahasa Malaysia, Indonesian, Simplified Chinese, Traditional Chinese, Thai; content seeded from nutric.com per language, English fallback when missing.
- Runs locally with `npm install && npm run seed && npm run dev`.

### Out of scope
Cart/checkout, user accounts for visitors, region selector, careers page, sending newsletter emails, deployment setup.

### Assumptions
- Images/text belong to Nutric (I-Linkage Sdn. Bhd.); user has rights to reuse them or this is a redesign concept.
- Testimonial videos are YouTube embeds from Nutric's official channel (youtube.com/c/nutricofficial). No testimonial quotes are invented; if real ones aren't found, brand videos are used and text fields are left for the admin to fill.
- Product pages use an "Enquire / Find a distributor" CTA linking to the contact info, not "Buy".

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | SvelteKit (Svelte 5, TypeScript), adapter-node |
| Styling | Tailwind CSS v4; tokens: forest `#1F3B2A`, deep `#12241A`, cream `#F4F1E8`, lime `#C8F07A`; fonts Poppins (headings), Inter (body) |
| DB | SQLite (`better-sqlite3`) + Drizzle ORM + drizzle-kit migrations; file `data/nutric.db` |
| Validation | Zod |
| Auth | argon2 (`@node-rs/argon2`) password hash, session table + httpOnly cookie |
| Markdown | `marked` + `sanitize-html` |
| Scraper | Playwright script (one-off) |
| Tests | Vitest (unit), Playwright (e2e) |

## 3. Languages

Codes: `en`, `ms`, `id`, `zh`, `zh-tw`, `th`. Default `en`.

- URL prefix: `/[lang]/...`; `/` redirects to `/en` (or `Accept-Language` match).
- UI strings: `src/lib/i18n/{lang}.json` dictionaries, accessed via `t(key)`.
- Content: per-entity `*_translations` table keyed by `(entity_id, lang)`.
- `getTranslation(rows, lang)` returns the requested language row, else `en` row. Single helper used everywhere.
- Language switcher in navbar keeps the current path.
- `<html lang>` set per request via `hooks.server.ts`.

## 4. Public routes

| Route | Content |
|---|---|
| `/[lang]` | Landing (sections below) |
| `/[lang]/products` | All published products grouped by series |
| `/[lang]/products/[slug]` | Product detail: gallery, description, benefits, ingredients, how to use, related products, enquire CTA |
| `/[lang]/series/[slug]` | Series banner, description, its products |
| `/[lang]/news` | News/events list, newest first, paginated (9/page) |
| `/[lang]/news/[slug]` | News detail: cover, date, location, body |
| `/[lang]/testimonials` | All testimonials |
| `/[lang]/accolades` | All accolades/certificates (lightbox on image) |
| `/[lang]/about` | About Nutric |

### Landing sections (in order)
1. **Navbar** — logo center, links left (Home, Products, News, About), language switcher + "Contact" pill right; transparent over hero, solid on scroll; mobile drawer.
2. **Hero** — full-bleed background image/video, headline split in two lines around centered product image (best seller), "100% natural" badge, glass card with testimonial video thumbnail, subheadline + "Shop Now →" lime CTA linking to best-seller detail.
3. **Best seller spotlight** — large product card: image, name, short description, 3 benefit chips, "View details".
4. **Product series** — 3 series cards (Revolutic, Vitanetic, Skinetique) with banner, then horizontal product list (cards) linking to detail; "View all products".
5. **About teaser** — text + image, link to About.
6. **Testimonials** — carousel of video cards (YouTube embed loaded on click, lite-embed pattern), quote + name; "See all".
7. **Accolades** — grid of certificate/award images with year and issuer; "See all".
8. **Latest news** — 3 latest published news cards; "All news".
9. **Newsletter + footer** — email form (saved to `subscribers`), footer links, socials (Facebook, Instagram, YouTube), copyright.

## 5. Data model

All tables have `id INTEGER PK`, `created_at`, `updated_at`.

```
series(slug UNIQUE, banner_image, sort_order)
series_translations(series_id FK, lang, name, tagline, description)  UNIQUE(series_id, lang)

products(slug UNIQUE, series_id FK, main_image, gallery JSON[], is_best_seller BOOL,
         is_published BOOL, sort_order)
product_translations(product_id FK, lang, name, short_description, description_md,
         benefits JSON[], ingredients_md, how_to_use_md)  UNIQUE(product_id, lang)

news(slug UNIQUE, cover_image, event_date, location, status 'draft'|'published', published_at)
news_translations(news_id FK, lang, title, excerpt, body_md)  UNIQUE(news_id, lang)

testimonials(person_name, role, avatar_image, youtube_url NULL, is_published, sort_order)
testimonial_translations(testimonial_id FK, lang, quote)

accolades(image, year, issuer, is_published, sort_order)
accolade_translations(accolade_id FK, lang, title, description)

site_settings(singleton row id=1: hero_media, hero_media_type 'image'|'video', hero_product_image)
site_settings_translations(lang, headline_line1, headline_line2, subheadline, cta_label, about_teaser_md)

subscribers(email UNIQUE, lang)
admin_users(email UNIQUE, password_hash)
sessions(id TEXT PK, user_id FK, expires_at)
```

Foreign keys cascade delete to translations. Best-seller spotlight = first published product with `is_best_seller` by `sort_order`; other best sellers show a badge.

## 6. Admin panel (`/admin`)

- `/admin/login` — email + password, rate-limited (5 attempts / 15 min per IP, in-memory). First admin created by seed from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
- Guard in `hooks.server.ts`: any `/admin/*` (except login) without a valid session → redirect to login. Session 7 days, sliding.
- `/admin` — dashboard: counts per type, latest drafts.
- `/admin/{products|series|news|testimonials|accolades}` — table list with thumbnail, name (EN), status, sort order, best-seller toggle (products), search, publish toggle, delete with confirm dialog.
- `/admin/{type}/new` and `/admin/{type}/[id]` — edit form:
  - Shared fields on top.
  - Language tabs EN · MS · ID · 中文 · 繁中 · ไทย, each with completeness dot. EN required, others optional.
  - Markdown fields: textarea + live preview.
  - Image upload with preview: jpg/png/webp, ≤5 MB, stored at `static/uploads/{type}/{uuid}.{ext}`.
- `/admin/settings` — hero texts per language, hero media.
- `/admin/subscribers` — list + CSV export.
- `/admin/account` — change password.
- Mechanics: SvelteKit form actions + `use:enhance`; Zod validation server-side; inline field errors; toast on success.

## 7. Content seeding

1. `scripts/scrape.ts` (Playwright): visits nutric.com home, `/products`, series pages, each product page, `/news` + each article, `/accolades`, `/about-us`; switches through the 6 languages; downloads images into `seed/images/`; writes `seed/data.json`. Also collects YouTube video IDs from the official channel / embedded videos for testimonials.
2. `npm run seed`: runs migrations, wipes content tables, inserts from `seed/data.json`, copies images to `static/uploads/`, creates admin user, sets BioSpray as best seller.
3. Scraping runs once; the site never calls nutric.com at runtime. `seed/data.json` is committed so seeding is reproducible.

## 8. Error handling

- Unknown lang → redirect to `/en` + same path. Unknown slug → 404 page (translated).
- `+error.svelte` for 404/500 with link home.
- Missing image → placeholder via `onerror` fallback.
- Upload rejects wrong type/size with field error.
- DB errors in actions → generic error toast, logged server-side.
- Markdown output always sanitized.

## 9. Testing

- **Vitest**: `getTranslation` fallback, Zod schemas, slugify, password hash/verify, session create/validate/expire.
- **Playwright e2e**: landing renders in all 6 langs; product + news detail load; `/admin` redirects when logged out; admin login → create news → visible on `/en/news`.

## 10. Project structure

```
src/
  lib/
    server/db/{schema.ts,index.ts}   server/auth.ts   server/content.ts (queries)
    server/upload.ts   i18n/{index.ts,*.json}   components/   schemas.ts
  routes/
    [lang]/(site)/...                 admin/...           api/subscribe
scripts/scrape.ts   scripts/seed.ts
seed/data.json   seed/images/
data/nutric.db (gitignored)
```
