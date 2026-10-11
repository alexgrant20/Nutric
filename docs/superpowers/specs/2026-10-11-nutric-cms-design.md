# Nutric CMS: Design Spec

Date: 2026-10-11
Status: Draft for review (rev 2: UI direction + generic/configurable architecture)

## 1. Goal

Rebuild the Nutric healthcare-products website (source: https://www.nutric.com/) as a modern single-landing-page site with detail pages, managed through a custom admin panel. Visual direction follows the "Verdare" reference image: full-bleed nature hero, oversized headline split around a centered product shot, one glass card, lime call-to-action. Section 11 turns that reference into concrete, justified decisions.

### Success criteria
- Landing page presents: hero, best-seller spotlight, product collections + product list, about teaser, video testimonials, accolades/certificates, latest news, newsletter.
- Each landing section links to its own detail page.
- Separate News page for Nutric events, with detail pages.
- All content, section order/visibility, theme tokens, and brand details are editable in `/admin` without touching code.
- Nothing in the code is hardcoded to the Nutric brand. A second brand could be loaded by changing seed data and settings only (see section 14).
- 6 languages: English, Bahasa Malaysia, Indonesian, Simplified Chinese, Traditional Chinese, Thai; content seeded from nutric.com per language, English fallback when missing.
- Runs locally with `npm install && npm run seed && npm run dev`.

### Out of scope
Cart/checkout, visitor accounts, region selector, careers page, sending newsletter emails, media library, deployment setup, role-based admin users (single admin only).

### Assumptions
- Images/text belong to Nutric (I-Linkage Sdn. Bhd.); the owner has rights to reuse them, or this is a redesign concept.
- Testimonial videos are YouTube embeds from Nutric's official channel (youtube.com/c/nutricofficial). No quote, name, or number is invented. If no real testimonial exists in the source, the testimonials section stays hidden until the admin adds one (section 13).
- Product pages have no "Buy" action. The enquiry action uses contact details stored in settings (email, phone, WhatsApp). Each is optional; the button only renders when at least one exists.
- Scraped copy is Nutric's own and is stored verbatim. This includes any health or benefit claims. The system never generates new claims (see open question Q1).

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | SvelteKit (Svelte 5, TypeScript), adapter-node |
| Styling | Tailwind CSS v4 with design tokens exposed as CSS variables (section 11.3) |
| Fonts | Self-hosted via `@fontsource` (no third-party font CDN): Poppins, Fraunces, Noto Sans SC/TC/Thai for CJK and Thai |
| DB | SQLite (`better-sqlite3`) + Drizzle ORM + drizzle-kit migrations; file `data/nutric.db` |
| Validation | Zod |
| Auth | argon2 (`@node-rs/argon2`) password hash, session table + httpOnly cookie |
| Markdown | `marked` + `sanitize-html` |
| Scraper | Playwright script (one-off) |
| Tests | Vitest (unit), Playwright + axe-core (e2e and accessibility) |

## 3. Languages

Codes: `en`, `ms`, `id`, `zh`, `zh-tw`, `th`. Default `en`. The enabled list lives in `src/lib/i18n/config.ts` (code, native label, font stack, enabled flag), so adding or disabling a language is a config change.

- URL prefix: `/[lang]/...`; `/` redirects by `Accept-Language` match, else `/en`.
- UI strings: `src/lib/i18n/{lang}.json`, accessed via `t(key)`. Every string a visitor sees comes from here or from the database. No literal text in components.
- Content: per-entity `*_translations` table keyed by `(entity_id, lang)`.
- `getTranslation(rows, lang)` returns the requested language row, else the `en` row, and reports which language it actually used. When it falls back, the rendered element gets `lang="en"` so screen readers pronounce it correctly.
- Language switcher is a list of real links to the same path in each language (works without JavaScript). `<link rel="alternate" hreflang>` is emitted for every enabled language (the English fallback guarantees every URL renders).
- `<html lang>` set per request in `hooks.server.ts`.

## 4. Public routes

| Route | Content |
|---|---|
| `/[lang]` | Landing (section list in 12) |
| `/[lang]/products` | All published products grouped by collection |
| `/[lang]/products/[slug]` | Product detail |
| `/[lang]/collections/[slug]` | Collection banner, description, its products |
| `/[lang]/news` | News/events list, newest first, paginated (9/page) |
| `/[lang]/news/[slug]` | News detail |
| `/[lang]/testimonials` | All testimonials |
| `/[lang]/accolades` | All accolades/certificates (lightbox) |
| `/[lang]/about` | About page |
| `/[lang]/terms` | Terms and privacy page (from `terms_md`, linked from the footer when present) |

Detail-page compositions are in section 12.2. The navbar is generated from the sections that actually render (section 12.3), so it can never link to something missing.

## 5. Data model

All tables have `id INTEGER PK`, `created_at`, `updated_at`.

```
collections(slug UNIQUE, banner_image, sort_order)
collection_translations(collection_id FK, lang, name, tagline NULL, description NULL, banner_alt NULL)  UNIQUE(collection_id, lang)

products(slug UNIQUE, collection_id FK, main_image, gallery JSON[{path}], is_best_seller BOOL,
         is_published BOOL, sort_order)
product_translations(product_id FK, lang, name, short_description, description_md,
         benefits JSON[], ingredients_md, how_to_use_md, faqs JSON[{q,a}], regulatory_text NULL, image_alt)  UNIQUE(product_id, lang)

news(slug UNIQUE, cover_image, event_date, location, status 'draft'|'published', published_at)
news_translations(news_id FK, lang, title, excerpt, body_md, cover_alt)  UNIQUE(news_id, lang)

testimonials(person_name NULL, role NULL, avatar_image NULL, youtube_url NULL, poster_image NULL,
             is_published, sort_order)
testimonial_translations(testimonial_id FK, lang, title, quote NULL)

accolades(image, year NULL, issuer NULL, is_published, sort_order)
accolade_translations(accolade_id FK, lang, title, description, image_alt)

page_sections(key UNIQUE, position, is_enabled)
   keys: hero, best_seller, collections, about, testimonials, accolades, news, newsletter

site_settings(singleton id=1:
   brand_name, logo_image, hero_media, hero_media_type 'image'|'video', hero_product_image,
   contact_email NULL, contact_phone NULL, whatsapp_url NULL, social_links JSON[{platform,url}],
   theme JSON{ colors, fonts, radius }  -- validated, section 14.2)
site_settings_translations(lang, tagline, headline_line1, headline_line2, subheadline,
   cta_label NULL, hero_badge_text NULL, about_teaser_md, about_md, terms_md, about_image_alt, footer_note)

subscribers(email UNIQUE, lang)
admin_users(email UNIQUE, password_hash)
sessions(id TEXT PK, user_id FK, expires_at)
```

- Foreign keys cascade delete to translations.
- Long text is Markdown, sanitized when rendered.
- Best-seller spotlight = first published product with `is_best_seller` by `sort_order`. If none, the spotlight section does not render. Other best sellers show a plain text marker "Best seller" (real flag, real meaning).
- Alt text is a translatable field on every content image. Missing alt falls back to the item's name, never to an empty string on a meaningful image.
- `hero_badge_text` is nullable. The round badge in the reference renders only if the owner fills it in with a claim they can back (section 11.2).

## 6. Admin panel (`/admin`)

The admin is generated from one field-definition registry (section 14.1), not five hand-written copies.

- `/admin/login`: email + password, rate-limited (5 attempts / 15 min per IP, in-memory). First admin created by seed from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
- Guard in `hooks.server.ts`: any `/admin/*` (except login) without a valid session redirects to login. Session 7 days, sliding.
- `/admin`: dashboard with counts per type and latest drafts. Empty counts show the next action ("No news yet. Add the first event").
- `/admin/{products|collections|news|testimonials|accolades}`: table list with thumbnail, name (EN), status, sort order, best-seller toggle (products), search, publish toggle, delete with confirm dialog.
- `/admin/{type}/new` and `/admin/{type}/[id]`: edit form. Shared fields on top, then language tabs (EN, MS, ID, 中文, 繁中, ไทย) with a completeness dot per tab (dot = real state: complete or missing required fields). EN required, others optional. Markdown fields are textarea + live preview. Image upload with preview, jpg/png/webp up to 5 MB, stored under `UPLOAD_DIR` (default `data/uploads/{type}/{uuid}.{ext}`) and served by a `/uploads/[...path]` route, because adapter-node does not serve files added to `static/` after the build.
- `/admin/sections`: drag-to-reorder and enable/disable the landing sections (keyboard accessible: move up/down buttons). Shows which sections will auto-hide because they have no content.
- `/admin/settings`: brand (name, logo, contact, socials), hero texts per language, hero media, theme tokens with live contrast check, tabs by group.
- `/admin/subscribers`: list + CSV export.
- `/admin/account`: change password.
- Mechanics: SvelteKit form actions + `use:enhance`; Zod validation server-side; inline field errors; toast on success. Every admin form has idle, submitting, success, and error states (section 13).

## 7. Content seeding

1. `scripts/scrape.ts` (Playwright + fetch): the source is an Angular app. Translated text for news and About Us is in `https://www.nutric.com/assets/i18n/{en,ms,id,zh,zh_tw,th}.json`. Product text and FAQs are rendered on `/products` in the selected language (language is stored in `localStorage.lang`), news cards on `/news`, accolades are images. The script downloads images into `seed/images/` and writes `seed/data.json`. It also records YouTube video IDs found in the source.
2. `npm run seed`: runs migrations, wipes content tables, inserts from `seed/data.json`, copies images to `static/uploads/`, creates the admin user, creates default `page_sections`, sets BioSpray as best seller.
3. Scraping runs once; the site never calls nutric.com at runtime. `seed/data.json` is committed so seeding is reproducible.
4. The scraper records only what exists. A missing field stays `NULL`. It never fills gaps with generated text, and it never creates people, quotes, or figures.
5. The scraper writes `seed/REPORT.md`: per entity and language, what was found and what is missing, so the owner knows exactly which content to supply.

## 8. Error handling

- Unknown lang redirects to `/en` + same path. Unknown slug shows the translated 404 page.
- `+error.svelte` for 404/500 with link home.
- Missing image shows a neutral placeholder block with the item name as text (not a fake photo).
- Upload rejects wrong type or size with a field error.
- DB errors in actions show a generic error message and are logged server-side.
- Markdown output is always sanitized.

## 9. Testing

- **Vitest**: `getTranslation` fallback (including reported language), Zod schemas, slugify, password hash/verify, session create/validate/expire, theme token contrast validator, section auto-hide logic.
- **Playwright e2e**: landing renders in all 6 languages; product and news detail load; `/admin` redirects when logged out; admin login, create news, then it is visible on `/en/news`; reorder sections and see the landing change.
- **Accessibility (axe-core in Playwright)**: zero serious or critical violations on landing, product detail, news detail, admin list, admin form, in each shipped theme.
- **Keyboard test**: Tab through the landing in visual order; open and close the mobile menu, lightbox, and delete dialog with Enter/Escape; every focus stop shows a visible ring.
- **Overflow test**: at 360, 768, 1280 px, `document.documentElement.scrollWidth <= innerWidth` on every public route in all 6 languages (catches long Thai and Indonesian strings).
- **Reduced motion test**: with `prefers-reduced-motion: reduce`, no transform animations run and the hero video is paused.
- **Hero contrast test**: render the hero in each language and sample the pixels under the headline and subheadline boxes; assert 4.5:1 (3:1 for large type) against the text color.

## 10. Project structure

```
src/
  lib/
    server/db/{schema.ts,index.ts}   server/auth.ts   server/content.ts (queries)
    server/upload.ts   server/entities.ts (field registry, 14.1)
    i18n/{config.ts,index.ts,*.json}   theme/{tokens.ts,contrast.ts}
    components/{site,admin,ui}/   schemas.ts
  routes/
    [lang]/(site)/...                 admin/...           api/subscribe
scripts/scrape.ts   scripts/seed.ts
seed/data.json   seed/images/   seed/REPORT.md
data/nutric.db (gitignored)
```

---

## 11. UI design direction

### 11.1 Design Read and dials

> Reading this as: a natural healthcare product catalogue and event news site for health-conscious consumers and distributors across Malaysia, Indonesia, Greater China and Thailand, in a botanical editorial style (full-bleed landscape photography, restrained forest-green palette, serif product names), dial **ENERGY 2 / RHYTHM 3 / MOTION 2**.

- **ENERGY 2**: a clear hero statement and one strong accent moment, calm everywhere else. Healthcare content needs trust more than spectacle.
- **RHYTHM 3**: every landing section has its own composition (12.1). Sections are not a repeated title + subtitle + card grid.
- **MOTION 2**: one-time entrance transitions and hover states; no loops (11.6).

Identity motif: the **headline that wraps around the product**. In the hero, the two headline lines sit left and right of the centered bottle photo, so the product is physically inside the sentence. The motif repeats only in the best-seller section (product image overlapping the text block) and nowhere else, so it stays a signature instead of a pattern.

Test passed: if the logo and name were swapped, the landscape photography, the headline-around-product composition, and the serif product naming would still point to a botanical wellness brand, not to a generic SaaS template.

### 11.2 Reference image: what we keep, change, and drop

| Reference element | Decision | Reason (R-31) |
|---|---|---|
| Full-bleed misty-hills photo | Keep, with a dark-green scrim | The photograph is the brand's mood; scrim guarantees text contrast (R-25) |
| Headline split around the product bottle | Keep, hero only | It is the identity motif; the product is the point of the page |
| Frosted glass video card | Keep as the **only** glass element on the page | Dose cap of 1-2 (R-10); it sits over the photo where blur reads as depth and separates the testimonial teaser from the headline |
| Navbar over the photo | Transparent at top, solid forest after 80px scroll, no blur | Keeps glass to one element; solid bar guarantees contrast over any section |
| Lime pill "Shop Now →" | Keep the lime pill for the single primary CTA. Drop the arrow. Copy becomes "See {product name}" | Pill is allowed once as the page's one primary action (R-11); the arrow adds nothing the label does not say (R-08); there is no shop, so "Shop Now" would be a dead promise (R-24, R-26) |
| Round "100% PLANT BASED" badge | Render only if `hero_badge_text` is filled by the owner | A claim like this must be true and provable (R-36); it is not assumed for Nutric products |
| Thin horizontal rule lines across the photo | Drop | Decorative lines with no function (R-07) |
| Serif product name on bottle label | Adopt Fraunces for product names and quotes | Echoes the label typography; separates "product voice" from interface text |
| Sign-in button, basket icon | Drop | No accounts, no cart (R-24, R-26) |

### 11.3 Design tokens

All tokens are CSS variables set from `site_settings.theme` (14.2). Defaults:

| Token | Value | Role |
|---|---|---|
| `--forest-900` | `#12241A` | Core 1: deepest surface (hero scrim base, footer) |
| `--forest-700` | `#1F3B2A` | Core 1: primary surfaces, headings on cream |
| `--cream-100` | `#F4F1E8` | Core 2: page background |
| `--ink-900` | `#1B1F1C` | Neutral: body text on cream |
| `--stone-600` | `#5A6159` | Neutral: secondary text on cream (meta, dates) |
| `--lime-400` | `#C8F07A` | The one accent |

Palette follows R-29: two core colors (forest, cream), neutrals, one accent.

**Accent budget (lime appears only here):** the primary hero CTA, the "Best seller" marker, the focus ring on dark surfaces, and the active language in the switcher. It is never used for icons, borders, backgrounds, or glow.

**Contrast rules (R-25):** every foreground/background pair used in the UI is listed in `tokens.ts` with its required ratio (4.5:1 body, 3:1 large text and UI boundaries). A Vitest test computes each ratio and fails the build below threshold. The admin theme editor runs the same validator and refuses to save a failing token set.

### 11.4 Typography

| Use | Font | Reason |
|---|---|---|
| Headlines, UI, body (Latin) | Poppins 400/500/600 | Geometric, friendly sans that matches the reference headline; reads well at display and text sizes; one family keeps the interface quiet |
| Product names, quotes, news titles | Fraunces 500 | Serif contrast echoes the bottle label in the reference; signals "botanical product" without decoration |
| Simplified / Traditional Chinese | Noto Sans SC / TC | Poppins has no CJK glyphs; Noto matches its weight range |
| Thai | Noto Sans Thai | Poppins has no Thai glyphs |

- Font stacks are chosen per language with `:lang()` selectors. Fraunces falls back to the language's Noto Serif where glyphs are missing.
- Fluid scale with `clamp()`: hero headline 40-96px, section titles 28-48px, body 16-18px, meta 14px. Body is never below 16px.
- Body line-length capped at 68ch; CJK uses `line-break: strict`; Thai uses `word-break: normal` with `overflow-wrap: anywhere` as a safety net.
- No uppercase wide-tracked labels. Section labels are sentence case.
- Fonts are self-hosted, subset per script, `font-display: swap`.

### 11.5 Shape, depth, and imagery

- **Radius scale:** `4px` (inputs, chips, small controls), `12px` (cards, media), `pill` (the one primary CTA only). Nothing else is pill-shaped; the language switcher and buttons elsewhere use 4px. Reason: radius marks hierarchy (R-11).
- **Elevation:** everything sits flat by default. Shadow is used only on the best-seller card (it floats above the section to mark the featured item), the lightbox, and dialogs. Reason: elevation = "above the page" (R-12).
- **Glass:** hero testimonial card only (11.2).
- **Glow:** none (R-13).
- **Backgrounds:** solid cream or forest; the photograph is the only texture. No grid, dots, blobs, or gradients except the hero scrim, whose purpose is legibility (R-01, R-07).
- **Icons:** the interface needs very few, all functional (menu, close, previous/next chevrons, play, external link). They are hand-set inline SVGs at one stroke weight, drawn for those jobs. No feature icons: benefits are written as text chips, so there is no sparkle/leaf/star decoration (R-04). Social links use each platform's own mark.
- **Imagery:** real product and event photographs from the source only, with `width`/`height` set to avoid layout shift, `srcset` at 480/960/1600, WebP/AVIF where supported, lazy-loaded below the fold. No stock illustrations (R-22).
- **Arrows:** none on buttons (R-08). Carousel and rail controls use chevrons because they indicate a real direction.

### 11.6 Motion (dial 2)

| Moment | Behaviour | Purpose |
|---|---|---|
| Hero first paint | Photo scales 1.04 to 1 over 1.2 s, once | Settles attention on the headline; plays once |
| Section titles and lead blocks | Fade + 12 px rise on first scroll into view, 300 ms, once | Marks a new section; elements are visible with JS disabled |
| Product rail, news rows, accolade strip | Hover/focus: image scales 1.03, 200 ms | Feedback that the item is a link |
| Navbar | Background transition on scroll, 200 ms | Contrast guarantee |
| Lightbox, dialogs, mobile menu | 150 ms fade/slide | Orientation |
| Hero video (optional) | Autoplay muted, with a visible pause control | WCAG 2.2.2; looping ambient video is motion, so the user can stop it |

Forbidden: endless pulses, floating elements, parallax, stacked fade+scale+bounce. With `prefers-reduced-motion: reduce`, transforms are removed (opacity-only), and the hero video does not autoplay.

### 11.7 Copy rules for UI text

- No em dashes anywhere in UI text or in this spec (use comma, period, colon, parentheses).
- CTAs name the action: "See BioSpray", "Ask about this product", "Read the article", "Watch the testimonial", "View all products", "Subscribe to event updates". Never "Get Started", "Learn More", "Explore", "Discover".
- No marketing buzzwords authored by us. Brand-owned text (scraped) is shown verbatim and is the owner's responsibility (Q1).
- Placeholder text is explicit: inputs use `Your name`, `email@example.com`; empty data is shown as empty, never as made-up values.

### 11.8 Decision log (one-line reasons)

| Decision | Reason |
|---|---|
| Forest + cream + one lime accent | Botanical, trustworthy, matches the reference, and fits in 2 core colors + 1 accent |
| Poppins + Fraunces | Matches reference headline and bottle label; two voices only |
| Full-bleed photo hero | Brand mood lives in the landscape; the product is the focal point |
| One glass card | Needs depth over a photograph; limited to a single element |
| Flat everywhere else | Keeps hierarchy readable; elevation reserved for the featured product |
| No feature cards or icons | Benefits are short facts; text chips carry them without decoration |
| Timeline for accolades | The content is dated; years are the natural structure |
| Video-first testimonials | The source material is video; quotes support it |
| Light default, no theme toggle in v1 | Content-first health product; photography is tuned for light surfaces. A dark theme is out of scope, so there is no half-working toggle (R-21, R-34) |

---

## 12. Page composition

### 12.1 Landing sections (RHYTHM 3: each section differs)

| # | Section (key) | Composition | Focal point | Surface | Source and hide rule |
|---|---|---|---|---|---|
| 1 | Navbar | Logo centered, text links left, language switcher and contact action right; mobile drawer | Logo | Transparent over hero, then solid forest | Links built from rendered sections (12.3) |
| 2 | Hero (`hero`) | Full-bleed photo + scrim; headline lines flank the best-seller bottle; glass testimonial card bottom-left; subheadline + lime CTA bottom-right | The product bottle inside the headline | Photo | Needs `hero_media` and a best seller; if no best seller, the bottle and CTA are omitted and the headline centers |
| 3 | Best seller (`best_seller`) | Asymmetric 5/7 split: large bottle image overlapping the card edge on the right, text block on the left (name in Fraunces, short description, benefit chips as text, link to detail) | The bottle | Cream; card carries the one shadow | Hidden when no published best seller |
| 4 | Collections and products (`collections`) | Left: vertical list of collections (name + tagline) acting as filters; right: horizontal scroll-snap product rail with a "View all products" link. Mobile: collection chips above the rail | The active collection's rail | Forest-700, cream text | Hidden when no published product. A collection with no products is not listed |
| 5 | About teaser (`about`) | Large-type paragraph spanning 8 columns, a single offset photo, text link to About | The paragraph | Cream | Hidden when `about_teaser_md` is empty |
| 6 | Testimonials (`testimonials`) | One large video player (poster, click to load YouTube) + right-hand list of other videos (thumbnail, name, role); quote under the player | The featured video | Forest-900 | Hidden when no published testimonial. Never generated |
| 7 | Accolades (`accolades`) | Horizontal timeline by year when items have years (plain strip otherwise); certificates at natural aspect ratio on the line; click opens lightbox with title, issuer, year | The year ruler | Cream | Hidden when none; years from data only |
| 8 | News (`news`) | One featured article (large cover, title, date, location) + two stacked list rows (date, location, title, no image); "View all news" link | The featured article | Cream | Hidden when no published news |
| 9 | Newsletter + footer (`newsletter`) | Single-line email form on forest; footer in two columns: sections that exist, and contact/socials that are set | The email field | Forest-900 | Form always renders; footer lists only real links |

Reason products are shown as identical rail cards: they are homogeneous data items browsed side by side. The variation lives between sections, not inside the list (R-14).

Background tones are tied to the section key, not its position. Reordering in the admin cannot produce a text/background contrast failure or flip colors mechanically (R-05).

### 12.2 Detail pages

| Page | Composition |
|---|---|
| Product detail | Left: gallery (main image + thumbnails, keyboard operable). Right: name (Fraunces), collection link, short description, benefit chips, "Ask about this product" (renders only if a contact method exists). Below: stacked sections for Description, Ingredients, How to use, FAQs (each hidden if empty), the regulatory text, then related products from the same collection |
| Collection | Banner photo with collection name and tagline, description, product grid |
| News list | Featured latest article, then 3-column list of covers with date and location; pagination |
| News detail | Cover, title, date and location line, Markdown body in a 68ch column, "Back to news", previous/next article |
| Testimonials | Large video list, one per row, with quote |
| Accolades | Same timeline as the landing, with every item expanded (title, issuer, description) |
| About | Long-form Markdown from settings with photo |

### 12.3 Navigation

- The navbar items are produced from the enabled, non-empty landing sections: Products, Testimonials, Accolades, News, About. Each links to that section's own page (`/[lang]/products`, `/testimonials`, `/accolades`, `/news`, `/about`), so every item has a real destination.
- A section that is disabled or empty does not appear in the navbar or the footer. There is no manual nav editor, so there are no dead links (R-24).
- The contact action in the navbar is a real `mailto:`, `tel:`, or WhatsApp link from settings, and does not render if none is set.
- Skip-to-content link is the first focus stop.

---

## 13. States and content integrity

### 13.1 States per view

| View | Empty | Loading | Error |
|---|---|---|---|
| Landing sections | Section hidden (no placeholder section) | Server-rendered, no loading state needed | 500 page with link home |
| Product/news/accolade list pages | "No {items} published yet." plus link to landing | Server-rendered | Translated error page |
| Product rail filter | Collection with no products is not offered | Instant (client-side filter of rendered items) | n/a |
| Testimonial video | Poster + play button | Play button becomes "Loading video"; iframe loads on click | "Video could not load. Open it on YouTube" with real link |
| Newsletter form | Idle with field label | Button shows "Sending", disabled | Inline message under field: invalid email, already subscribed, or "Could not save, try again" |
| Admin lists | "No {items} yet." + primary "Add {item}" button | Row skeletons matching the real column layout while data loads | Inline banner with cause and Retry |
| Admin forms | Required fields marked | Button "Saving" with disabled state, no double submit | Per-field errors + summary at top, focus moves to the first error |
| Image upload | Dashed drop area with accepted types and size | Progress text | Reason shown: wrong type, over 5 MB, or server error |

### 13.2 No fabricated content

- Seed data comes only from the scraper. No invented testimonials, names, avatars, statistics, awards, clients, or numbers. The landing has no stat strip and no "trusted by" logos.
- Missing alt text, quotes, or translations are reported in `seed/REPORT.md` and flagged in the admin (completeness dot), not filled in.
- Where a visitor-facing claim exists (the optional hero badge), the admin shows a note: "Only enter claims you can document."
- No FAQ section on the landing. The source site has real per-product FAQs, which are shown as an accordion on the product detail page (the `faqs` field); products without FAQs show none.
- Regulatory text from the source (registration number, advertisement approval code and expiry date) is stored verbatim in `regulatory_text` and shown on the product page. The seed report flags any approval whose expiry date is in the past (Q5).
- Terms and Privacy pages are required before the newsletter form accepts addresses in production. The footer links only to pages that exist. Until they exist, the newsletter form is labeled "Coming soon" in production mode (`NODE_ENV=production` and no legal pages configured) and is fully functional in development (R-26).

---

## 14. Generic, configurable architecture

Goal: the same codebase serves any similar brand. Nothing named Nutric, Revolutic, Vitanetic, or Skinetique appears in code, components, or i18n files. Those names exist only in data.

### 14.1 One registry drives the admin

`src/lib/server/entities.ts` describes each content type once:

```ts
{
  key: 'products',
  table, translationsTable,
  fields: [
    { name: 'main_image', type: 'image', required: true },
    { name: 'collection_id', type: 'relation', to: 'collections' },
    { name: 'is_best_seller', type: 'boolean' },
    { name: 'name', type: 'text', translatable: true, required: 'en' },
    { name: 'description_md', type: 'markdown', translatable: true },
    // ...
  ],
  list: { columns: ['main_image', 'name', 'is_published', 'sort_order'], searchable: ['name'] }
}
```

- Generic Svelte components (`EntityList`, `EntityForm`, `LanguageTabs`, `ImageField`, `MarkdownField`) render any entity from its definition, and the Zod schema is derived from the same definition.
- Adding a content type means adding one registry entry plus its public template, not a new admin.
- Public rendering stays hand-designed per section (the design is not auto-generated); only the admin and the data layer are generic.

### 14.2 Brand and theme are data

- Brand name, logo, tagline, contact details, socials, footer note, and the theme (`colors`, `fonts`, `radius` tokens from 11.3) live in `site_settings` and are injected as CSS variables in `+layout.svelte`.
- Theme save is validated by the contrast validator (11.3). A token set that fails any listed pair is rejected with the failing pair named.
- Font choice is limited to the self-hosted families, so there is no runtime request to third-party font servers.
- Terminology that varies by brand is an i18n key, not a code string ("collection", "best seller", "enquire"), so a brand can call collections "series" or "ranges" by editing the dictionary.

### 14.3 Sections are data

- `page_sections` controls order and visibility (6). The landing renders the enabled sections in `position` order from a section registry (`{ key, component, hasContent(data) }`). Empty sections auto-hide (12.1).
- Each section component has exactly one composition (12.1). Letting an admin swap layouts would let the rhythm collapse into one template, so variants are intentionally not offered.

### 14.4 Languages are config

- `src/lib/i18n/config.ts` lists languages with code, label, font stack, and enabled flag. Routes, switcher, hreflang, admin tabs, sitemap, and the seed script read this list. Disabling a language removes it everywhere without code changes elsewhere.

### 14.5 Environment

`.env`: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_PATH`, `UPLOAD_DIR`, `PUBLIC_SITE_URL`. No secrets in the repo; `.env.example` is committed.

---

## 15. Acceptance checklist (UI)

Run before calling the UI done, and report each line with evidence:

1. Every nav item, button, link, form, tab, dialog, and toggle clicked in the running app; each produces its real action; console has no errors (record the list element by element).
2. All 6 languages on landing, product detail, and news detail: no horizontal overflow at 360 px, no clipped text, correct font per language.
3. Keyboard-only run through the landing and admin: logical order, visible focus, Escape closes dialogs/lightbox/menu.
4. axe-core: zero serious or critical issues on the pages listed in section 9.
5. Contrast: token test green; hero pixel sampling green in all languages.
6. Reduced motion: no transforms, video paused.
7. Empty states: temporarily unpublish everything; the landing shows only the hero (headline centered) and newsletter/footer, with no empty placeholders and no dead nav links.
8. Dials check: sections visibly differ in composition (RHYTHM 3), motion matches section 11.6 (MOTION 2), accent appears only where 11.3 allows (ENERGY 2).
9. Content integrity: no number, name, quote, or claim in the UI that is not in `seed/data.json` or entered in the admin.

## 16. Owner decisions (resolved 2026-10-11) and what is still open

- **Q1 resolved:** scraped text is stored verbatim, no edits.
- **Q5 resolved:** the advertisement approval text is shown as written, flagged in `seed/REPORT.md`.
- **Q2 resolved:** the hero badge is wanted. Owner decision (2026-10-11): use dummy text until the real claim arrives, so the placeholder `[BADGE TEXT]` is seeded and shown. The real claim goes in `seed/curated/hero-badge.json` per language or in Admin > Settings; clearing the field hides the badge.
- **Q3 resolved:** if the YouTube channel has no clear customer testimonials, official Nutric brand videos (profile, events) are shown in the testimonials section under their real titles, and they are not presented as customer testimonials. The section keeps its name in the UI; see the open item below.
- **Q4 resolved:** scrape the Terms page from nutric.com (`/term-of-service`). Finding: it is NUTRIC INDONESIA's "Terms and conditions for online purchase" with a Privacy Policy section, so it describes a store this site does not have. It is stored verbatim as `terms_md`, flagged in the seed report, and Nutric must confirm or replace it before launch. Its Indonesia contact details are not used as the site contact.
- **Hero badge:** placeholder text `[BADGE TEXT]` is seeded until the real claim arrives; it is flagged in the seed report.

**Open item from Q3:** the UI label `testimonials.title` says Testimonials. If only brand videos are used, rename the section label to "Videos" (dictionary change in six languages) so the page does not imply customer reviews. Decide when the videos are known.

## 16a. Original open questions (kept for history)

- **Q1.** Scraped Nutric copy may include health or benefit claims, buzzwords, and em dashes. It is stored verbatim as the brand's own text. Should the seed script leave it untouched (default), or should the owner review and edit it in the admin before launch?
- **Q2.** Does Nutric have a real "100% natural/plant based"-style claim they can document for the hero badge? If not, the badge stays off.
- **Q3.** Are there real testimonial videos or permission to feature people from Nutric's YouTube channel? If none are found, the testimonials section stays hidden until you add them.
- **Q5.** The advertisement approval printed on the source product pages says "Advertisement Expiry Date: 31/12/2025", which has passed. Keep showing it verbatim, hide it, or have Nutric supply the renewed code?
- **Q4.** Do Terms of Use and Privacy pages exist at nutric.com (the footer has a Terms link)? They will be scraped as simple pages if so.
