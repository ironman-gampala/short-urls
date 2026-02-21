# URL Shortener

A minimal URL shortener built with Node.js, Express, and Supabase. The frontend is vanilla HTML/CSS/JS served as static files; the backend uses the Supabase **service role key** only on the server—the browser never talks to Supabase.

## Supabase setup

Create the `links` table in the Supabase SQL editor:

```sql
create table public.links (
  code text primary key,
  url text not null,
  created_at timestamptz default now()
);
```

**RLS (Row Level Security):** You can leave RLS enabled. This app uses the **service role key** only on the server, so the client never connects to Supabase. The service role bypasses RLS. Do not expose the service role key to the frontend.

## Local run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (see `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Then set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project (Settings → API).

3. Start the server:
   ```bash
   npm start
   ```
   Open http://localhost:3000 (or the `PORT` you set in `.env`).

## Example: create a short link (curl)

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/very/long/path"}'
```

Example response:
```json
{"code":"aB3xY9z","shortUrl":"http://localhost:3000/aB3xY9z","longUrl":"https://example.com/very/long/path"}
```

Visiting `http://localhost:3000/aB3xY9z` redirects to the long URL.

## Deployment

- Set environment variables on your host: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `PORT`.
- Run with `node server.js` or `npm start`.
- Put the app behind a reverse proxy (e.g. nginx) or a platform (e.g. Railway, Render) that sets `PORT` and handles TLS.
