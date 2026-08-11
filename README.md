# KCSC Web App — Kallar Central Sports Club Admin

Next.js 16 (App Router) admin console for Kallar Central Sports Club's **free** tuition programme
for Grades 3, 4 and 5. It owns the MongoDB models and the API that the
[KCSC mobile app](https://github.com/AkshayanAH112/KCSC-MobileApp) also talks to.

There is **no fee, invoice, or payment surface anywhere in this product** — classes are free.

## Features

- **Students** — records, batches, auto-generated QR codes (`KCSC-<grade>-<hex>`), printable ID cards
- **Attendance** — QR scanner check-in, per-session rosters, per-student attendance rates
- **Marks analysis** — Excel import/export, per-subject averages, performance charts
- **News & Blog** — write posts with cover and gallery images (stored in Cloudinary) and publish
  them to the club's public landing page

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signs the admin JWT |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | News/blog image uploads |

Without the Cloudinary variables everything still runs; image upload returns a 503 explaining
what's missing.

### First admin user

The KCSC Atlas database already has `admin@kcsc.lk` seeded with a strong generated password
(handed over separately — it is not stored in this repo).

For a **fresh, empty** database, `GET /api/auth/seed` creates `admin@kcsc.lk` / `password123`.
That route is blocked in production and is for local development only — never point it at a live
database, and change the password immediately if you do use it.

### Deploying to Vercel

`.env.local` is git-ignored, so the same variables must be set in the Vercel project settings:
`MONGODB_URI`, `JWT_SECRET`, and the three `CLOUDINARY_*` values. In MongoDB Atlas, add
`0.0.0.0/0` to **Network Access** — Vercel's serverless functions do not have fixed egress IPs,
so an allowlist of specific addresses will fail in production.

## Commands

```bash
npm run dev      # Turbopack dev server on :3000
npm run build    # build + typecheck + lint gate — run before finishing a change
npm run start    # serve the production build
npm run lint     # eslint
```

No test runner is configured.

## Public API for the landing page

The club's public website is a separate project. It reads published posts from these two
read-only, unauthenticated endpoints (`/api/*` is served with
`Access-Control-Allow-Origin: *`, so any origin can fetch them):

```
GET /api/public/posts?category=news&limit=6&page=1
GET /api/public/posts/<slug>
```

`category` is one of `news`, `blog`, `event`, `achievement`. The list response is
`{ posts: [...], pagination: { page, limit, total, pages } }`; each post carries
`title`, `slug`, `excerpt`, `coverImageUrl`, `images[]`, `tags[]`, `author` and `publishedAt`.
Drafts are never returned.

Everything under `/api/posts` and `/api/upload` is admin-only (JWT via httpOnly cookie or
`Authorization: Bearer`), because those routes write content that renders on the public site.

## Design system

Maroon (`#720000`, sampled from the club crest) and gold. Tokens live in
[`app/globals.css`](app/globals.css); the rules behind them are in
`design-system/kallar-central-sports-club/MASTER.md` at the repo root of the workspace.
`Mobile app/src/index.css` holds an independent copy of the same tokens — **change both together.**

## Notes on this Next.js version

Next.js 16 has breaking changes versus older App Router conventions. Routing middleware is
`proxy.ts` at the project root, **not** `middleware.ts`. See `AGENTS.md`.
