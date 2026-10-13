# Nutric site and admin

### Automatic translation (DeepL)

The admin content forms and Settings have an **Automatic translation** control.
Choose English or Indonesia as the source, then one target or all other languages.
Only empty fields are filled. Existing translations are kept, and results remain
unsaved until you review the language tabs and click **Save**.

Create a free DeepL API key at https://www.deepl.com/pro-api (DeepL API Free, a
monthly character quota, keys end in `:fx`) and set it in `.env` or in the
Node.js app's environment variables, then restart NUTRIC:

```dotenv
DEEPL_API_KEY=your-key:fx
```

The key stays on the server. Translation is performed on demand by signed-in
admins; it never runs for visitors. Languages DeepL does not offer for your account
(the app asks DeepL which targets exist) are skipped when you choose "All other
languages", and a single unsupported target shows an error. Brand names, numbers,
URLs and Markdown/FAQ separators are retained. Review machine translations before
publishing, especially product terminology.

If no admin account exists, copy `.env.example` to `.env`, set your own
`ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters), then run:

```sh
node --env-file=.env --import tsx scripts/create-admin.ts
```

This creates an admin without reseeding or deleting site content. It refuses to
change an existing account's password. Do not use the sample password.

A single-landing-page website for Nutric healthcare products with detail pages (products, collections, news, videos, accolades, about, terms) and a custom admin panel. Built with SvelteKit 3 (Svelte 5), Tailwind v4, SQLite (Drizzle) and TypeScript. Content is seeded from nutric.com in six languages: English, Bahasa Malaysia, Indonesian, Simplified Chinese, Traditional Chinese and Thai.

The design is documented in `docs/superpowers/specs/2026-10-11-nutric-cms-design.md` and the build plan in `docs/superpowers/plans/2026-10-11-nutric-cms.md`.

## Requirements

- Node 24
- About 1 GB of free disk space (dependencies plus a Playwright browser)

## Setup

```bash
cp .env.example .env     # then edit ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters)
npm install
npm run seed             # creates data/nutric.db, copies images to data/uploads, creates the admin user
npm run dev              # http://localhost:5173
```

The admin is at `/admin`. Sign in with the credentials from `.env`.

## Admin

| Page | What it does |
|---|---|
| Dashboard | Counts per content type and the latest news drafts |
| Products, Collections, News, Testimonials (videos), Accolades | List, search, publish toggle, delete with confirmation, add and edit with one tab per language |
| Landing sections | Reorder and enable or disable landing sections. A section with no published content hides itself |
| Settings | Brand, logo, contact details, social links, hero media, theme colors (saving is refused if a text/background pair fails its contrast requirement) and per-language texts, including the hero badge and the terms page |
| Subscribers | Newsletter addresses with CSV export |
| Account | Change the admin password |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` then `node build` | Production build and server |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end, accessibility, overflow and keyboard tests (Playwright). Builds the app and seeds a separate `data/e2e.db` |
| `npm run scrape` | Re-scrape nutric.com into `seed/data.json`, `seed/images` and `seed/REPORT.md` |
| `npx tsx scripts/fetch-posters.ts` | Download each curated video's YouTube thumbnail into `seed/images` and set it as the poster in `seed/data.json` (run after `npm run scrape`, then `npm run seed`) |
| `npm run seed` | Load `seed/data.json` into the database (replaces content, keeps subscribers and sessions) |
| `npm run db:generate` | Generate a Drizzle migration after editing `src/lib/server/db/schema.ts` |

If Playwright cannot download its browser (for example the disk is full), point the scraper at an installed Chromium with the `CHROMIUM_PATH` environment variable.

## Production notes

For GitHub Actions builds and FTP deployment to cPanel, follow
[the cPanel deployment guide](docs/deploy-cpanel.md). The workflow keeps database,
uploads and server configuration separate from the production package.

- Copy the `drizzle/` folder next to the build output and run from the project root (migrations run on start).
- Set `DATABASE_PATH` and `UPLOAD_DIR` at run time. SvelteKit rejects form posts whose `Origin` differs from the request origin: behind a TLS proxy run the server with `PROTOCOL_HEADER=x-forwarded-proto` (and `HOST_HEADER=x-forwarded-host` if the proxy rewrites the host); to serve plain http, set `SITE_ORIGIN=http://your-host:port` when running `npm run build`.
- adapter-node rejects request bodies over 512 KB by default, which blocks normal photo uploads (the admin allows 5 MB per image, several images per save). Run the server with `BODY_SIZE_LIMIT=20M` (or higher).
- Uploaded images are served by the `/uploads` route from `UPLOAD_DIR`, not from `static/`.
- `NEWSLETTER_ENABLED` defaults to off outside development. Turn it on only when the Terms and Privacy text is final.

## Content notes

- Text scraped from nutric.com is stored verbatim, including product claims and the advertisement approval text. `seed/REPORT.md` lists what is missing or needs attention (for example approvals whose expiry date has passed).
- The Terms page comes from `https://www.nutric.com/term-of-service`, which is the "Terms and conditions for online purchase" of Nutric Indonesia and includes its privacy policy. It describes an online store this site does not have. Nutric should confirm or replace it (Admin > Settings > Texts by language).
- The hero badge is seeded as the placeholder `[BADGE TEXT]`. Replace it with a claim Nutric can document, or clear it to hide the badge.
- The "Videos" section lists official videos from the Nutric YouTube channel under their real titles. They are not presented as customer testimonials.
- Contact details are not seeded (the source lists Indonesia-only contacts). The contact buttons appear once you enter an email, phone or WhatsApp link in Settings.
- The interface dictionaries other than English (`src/lib/i18n/*.json`) are drafts and need review by native speakers before launch.
- Accolade years are read from the image file names (for example `2018-1.png`) and are unverified. Accolade titles and issuers are not on the source site.
