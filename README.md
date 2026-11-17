# Short URLs

A small, deployable URL shortener: paste a long link, get a short one (random or custom), and redirects work for anyone — not just your browser.

## About

Unlike a localStorage demo, this app has a real backend. Short codes are stored in **Supabase**, so visiting `https://your-host/aB3xY9z` redirects for every visitor.

| Feature | What it does |
|---|---|
| **Shorten** | `POST /api/shorten` with an `http(s)` URL → random 7-character code |
| **Custom code** | Optional vanity code (`mmt`, `resume`, …) — letters/numbers, 1–32 chars |
| **Redirect** | `GET /:code` looks up the long URL and returns `302` |
| **UI** | Vanilla HTML/CSS/JS form at `/` (static assets under `/static`) |
| **Security** | Supabase **service role key stays on the server** — the browser never talks to Supabase |

**Stack:** Node.js · Express · Supabase · vanilla frontend

## Supabase setup

Create the `links` table in the Supabase SQL editor:

```sql
create table public.links (
  code text primary key,
  url text not null,
  created_at timestamptz default now()
);
```

You can leave **RLS** enabled. The server uses the service role key, which bypasses RLS. Never put the service role key in frontend code or commit it to git.

## Local run

```bash
npm install
cp .env.example .env
# edit .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm start
```

Open http://localhost:3000 (or whatever `PORT` you set).

## API example

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/very/long/path"}'
```

```json
{
  "code": "aB3xY9z",
  "shortUrl": "http://localhost:3000/aB3xY9z",
  "longUrl": "https://example.com/very/long/path"
}
```

Custom code:

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","code":"demo"}'
```

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only key (never expose to the browser) |
| `PORT` | no | Defaults to `3000` |

## Deployment

1. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `PORT` on the host.
2. Run `npm start` (or `node server.js`).
3. Put the app behind TLS (Railway, Render, Fly, nginx, etc.).

## Repo

- **Owner:** [ironman-gampala](https://github.com/ironman-gampala)
- **GitHub:** https://github.com/ironman-gampala/short-urls
