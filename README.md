# Reddit Stories

An Astro-powered website that curates the best **reddit stories** from
`r/stories`, `r/RedditStoryTime`, and `r/nosleep`, with technical SEO, entity
structured data, an email newsletter, and a layedered web-scraping pipeline.

## Stack

- **Astro 5**, SSR (`output: "server"`), deployable on **Cloudflare Pages,
  Vercel, or any Node host** via the `HOSTING` build switch
  (`node` | `cloudflare` | `vercel`); adapters: `@astrojs/node`,
  `@astrojs/cloudflare`, `@astrojs/vercel`
- **got-scraping** — HTTP-level fetching with browser-like headers/TLS (Tier 1)
- **Playwright** — headless-browser fallback when HTTP is blocked (Tier 2,
  lazy-loaded; run `npx playwright install chromium` once to enable it).
  Node/auto mode only — excluded from the Cloudflare bundle.
- **Resend** — email newsletter + contact messages
- **sharp** — favicon/OG image generation (dev-only)

## Hosting

Pick a platform at build time (`npm run build:node | build:cf | build:vercel`,
or set `HOSTING=…` and run `npm run build`):

| Platform | Build | Output | Run |
| --- | --- | --- | --- |
| Node | `npm run build:node` | `dist/` (server + client) | `npm start` (or `node dist/server/entry.mjs`) |
| Cloudflare Pages | `npm run build:cf` | `dist/` (server + client) | `wrangler pages deploy dist` |
| Vercel | `npm run build:vercel` | `.vercel/output/` | `vercel deploy` |

Notes per platform:

- **Cloudflare**: set build command `npm run build:cf`, output directory `dist`,
  environment variables `SITE_URL`, `RESEND_API_KEY`, `CRON_SECRET`, etc. in
  the Pages dashboard. There is **no filesystem**: storage falls back to an
  in-memory backend (ephemeral per isolate) and the scraper defaults to
  `SCRAPER_SOURCE=mirror`, `SCRAPER_MODE=http` (the native/browser tiers and
  sharp are not bundled). Newsletter subscribers should rely on the Resend
  audience (`RESEND_AUDIENCE_ID`) for durable storage.
- **Vercel**: build command `npm run build:vercel`; Vercel auto-detects
  `.vercel/output`. Disk storage uses `/tmp` (`DATA_DIR=/tmp/data`).
- **Node**: use a process manager (systemd/pm2), container, or
  `pm2 start npm --name reddit-stories -- start`.

## Data sources (layered)

1. **Reddit direct** (`got-scraping`, browser-like TLS/fingerprint) — live, fastest.
2. **Playwright fallback** — launches a headless Chromium when Reddit returns
   403/429 to plain HTTP.
3. **Mirror APIs** — if Reddit blocks the server's IP entirely (common on cloud
   hosts), the site falls back to public Reddit content mirrors:
   **Arctic Shift** (`arctic-shift.photon-reddit.com`) with **PullPush**
   (`api.pullpush.io`) as backup. Both return the same Reddit post/comment
   schema, so nothing else changes.

Set `SCRAPER_SOURCE=mirror` to use the mirror exclusively (e.g. in blocked
environments), or `reddit` to never use mirrors.

## Quick start

```bash
npm install
npx playwright install chromium        # optional: enables browser fallback
npm run generate:assets                # builds favicon/og PNGs from SVGs
cp .env.example .env.local             # fill in values
npm run dev                            # http://localhost:4321
```

## Environment

See `.env.example` for the full list. Key variables:

| Variable | Purpose |
| --- | --- |
| `SUBREDDITS` | Comma-separated subreddits feeding the site |
| `DEFAULT_SORT` | `top` \| `hot` \| `new` |
| `SCRAPER_MODE` | `auto` (http then browser), `http`, or `browser` |
| `SCRAPER_SOURCE` | `auto` (reddit, then mirror fallback), `reddit`, or `mirror` |
| `MIRROR_PROVIDER` | Mirror provider when reddit is blocked: `arctic-shift` \| `pullpush` |
| `CACHE_TTL_SECONDS` | Cache TTL for scraped data (default 600) |
| `RESEND_API_KEY` | Newsletter + contact email |
| `CRON_SECRET` | Guards `/api/cron/newsletter` |
| `DATA_DIR` | Where subscribers/cache JSON live (Node/Vercel only, default `./data`; Vercel auto-uses `/tmp`) |

## Newsletter

- Signup form posts to `/api/newsletter` (email stored in the platform storage
  backend + synced to the Resend audience if `RESEND_AUDIENCE_ID` is set).
- Unsubscribe: `/unsubscribe` page or the link in every email.
- Send the daily digest manually: `npm run digest`.
- Or schedule it: POST `/api/cron/newsletter?secret=YOUR_CRON_SECRET`
  (e.g., a cron job, Vercel scheduled function, or Cloudflare cron trigger).

## SEO & entity layer

- Single brand entity in `src/lib/seo/site.ts`; JSON-LD helpers in
  `src/lib/seo/schemas.ts`.
- `WebSite` + `Organization` + `SearchAction` on every page; `ItemList` on the
  home feed; `Article` + `author` on story pages; breadcrumbs.
- `robots.txt`, `sitemap.xml`, and `llms.txt` are served dynamically.
- Query-param variants (sort/sub filters, search) are `noindex`; canonical
  URLs point to the clean path.

## Structure

```
src/
├── components/        # Header, Footer, StoryCard, SeoHead, NewsletterForm…
├── layouts/           # Root layout (fonts, meta, JSON-LD)
├── lib/
│   ├── scraper/       # http.ts, browser.ts, native.ts(+stub), mirror.ts,
│   │                  # cache.ts, index.ts
│   ├── storage/       # disk.ts (node/vercel), memory.ts (cloudflare)
│   ├── seo/           # site.ts (entity), schemas.ts (JSON-LD builders)
│   ├── newsletter/    # store.ts, send.ts, digest.ts
│   ├── config.ts      # env-driven config
│   └── env.ts         # platform detection (isCloudflare/isVercel)
└── pages/
    ├── index.astro            # feed ("Reddit Stories" keyword page)
    ├── story/[id]/[slug].astro
    ├── search/
    ├── privacy / terms / contact / disclaimer / unsubscribe
    ├── robots.txt.ts / sitemap.xml.ts / llms.txt.ts
    └── api/                   # stories, newsletter, contact, unsubscribe, cron
```

## Notes

- We do not scrape images — only post title + text + public metadata.
- Stories belong to their original authors on Reddit; author attribution is
  shown in the article. The site is not affiliated with Reddit Inc.
