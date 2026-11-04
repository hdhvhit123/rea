# hdh architecture

The reference site's source, database and infrastructure are unknown; nothing here claims to mirror them. This is a new design that reproduces the observed and documented behaviour.

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript**, server components for pages, route handlers for the API.
- **Tailwind CSS 4** with CSS-variable design tokens (`src/app/globals.css`), light and dark (`prefers-color-scheme`).
- **SQLite via Node's built-in `node:sqlite`** (Node ≥ 22.13). No native addon to compile. Schema migrations are idempotent and run on first connection (`src/lib/db.ts`).
- `qrcode` for PNG/SVG QR codes. No other runtime dependencies.

## Layers

```
src/lib/        domain + services (no React)
  validation.ts   URL / alias / password / expiry / mode rules (single owner of the rules)
  links.ts        create, redirect decision, click recording, stats, update, delete, trash, claim/import, export
  auth.ts         users, scrypt hashes, sessions (httpOnly cookie, token stored as SHA-256), password reset
  bio.ts          bio pages
  ratelimit.ts    in-process burst/daily/failed-credential limiters
  safety.ts       local blocklist + optional Google Safe Browsing adapter
  oauth.ts        Google/GitHub OAuth adapters (env-gated)
  mail.ts         mail adapter (outbox folder until a provider is configured)
  ua.ts           user-agent + geo-header parsing
  demo.ts         generated sample data for /d/demo only
src/app/api/    thin route handlers -> lib services; errors -> { error, errorKey, ... }
src/app/        pages
src/components/ client/server UI components
```

## Data model

| Table | Key columns |
|---|---|
| `links` | `code` (unique, case-insensitive), `original_url`, `title`, `control_mode`, `secret_code`, `password_hash`, `expires_at`, `max_clicks`, `clicks`, `qr_clicks`, `user_id`, `is_custom`, `blocked_type`, `deleted_at` |
| `clicks` | `link_id`, `ts`, `is_qr`, `country`, `city`, `device`, `browser`, `os`, `referrer` (no IP stored) |
| `users` | `email`, `password_hash`, `google_id`, `github_id` |
| `sessions` | `token_hash`, `user_id`, `expires_at` |
| `password_resets` | `token_hash`, `user_id`, `expires_at`, `used` |
| `bio_pages` | `user_id`, `handle`, `display_name`, `bio`, `theme`, `accent`, `links_json`, `published` |
| `abuse_reports` | `link`, `category`, `details`, `email` |

## Key flows

- **Redirect** `GET /{code}`: look up → if active and unprotected, count the click in one transaction (re-checking limits) and `302` to the destination. Otherwise `302` to `/go/{code}`, which renders the password form, expired, deleted, blocked or 404 page. QR codes encode `/{code}?qr=1` so scans count separately.
- **Password gate** `POST /api/go/{code}` (HTML form, works without JS): verify → count → `303` to the destination, or back to the gate with an error key.
- **Stats** `GET /api/links/{code}/stats`: owner (session) or secret (Full) or password (protected Stats only). Breakdowns are computed from `clicks` on read.
- **Delete** is soft: `deleted_at` set, code stays reserved, owners can restore within 30 days.
- **Guest → account**: Recent links (with secrets) live in `localStorage`; after login/register the client posts them to `/api/dashboard/claim`.

## Decisions and assumptions

- **Secret codes are stored in plaintext** because Export must include them (documented on the reference). Link passwords and account passwords are scrypt-hashed. [assumption]
- **Geo**: country/city come from edge headers (`cf-ipcountry`, `x-vercel-ip-country`, `x-vercel-ip-city`) when deployed behind such a proxy; otherwise country is estimated from `Accept-Language` and city is "Unknown". No GeoIP database is bundled. [assumption]
- **Rate limits** are in-memory per process; use a shared store (Redis) for multiple instances.
- **Safe Browsing** runs only with `GOOGLE_SAFE_BROWSING_KEY`; without it only the local blocklist applies (never reported as "safe").
- **OAuth** buttons appear only when client id/secret are set. The flow is implemented but **not verified** (no credentials available).
- **Email**: no provider is wired; reset mails are written to `HDH_MAIL_OUTBOX` (demo mode). Replace `sendMail` for production.
- **Bio subdomains** (`name.domain`) are not implemented; pages live at `/u/{name}`.
- **Demo stats** (`/d/demo`) use generated, clearly labelled sample clicks, created on first visit.
