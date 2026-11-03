# hdh — link shortener

A link shortener with custom aliases, expiry, passwords, QR codes, click analytics, accounts, a dashboard and bio pages. Behaviour is modelled on the public pages and docs of a reference shortener; the brand, copy and visual design are hdh's own. See [docs/analysis.md](docs/analysis.md) for what was observed and how.

## Requirements

- Node.js **22.13 or newer** (uses the built-in `node:sqlite`). Tested with Node 22.23.
- npm 10+.

## Run locally

```bash
cd hdh
cp .env.example .env.local      # optional; defaults work for localhost:3000
npm ci
npm run dev                     # http://localhost:3000
```

Production build:

```bash
npm run build
npm start                       # serves on port 3000
```

The SQLite database is created and migrated automatically at `HDH_DATABASE_PATH` (default `./data/hdh.db`) on first request. Delete the file to start fresh. The demo stats page `/d/demo` seeds its own sample data on first visit.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `HDH_BASE_URL` | `http://localhost:3000` | Public origin used in short URLs. Must match where the app is served. |
| `HDH_DATABASE_PATH` | `./data/hdh.db` | SQLite file. |
| `HDH_MAIL_OUTBOX` | `./data/outbox` | Where password-reset mails are written (no mail provider yet). |
| `HDH_RATE_BURST` / `HDH_RATE_DAILY` | `120` / `300` | Creation limits per IP. |
| `GOOGLE_SAFE_BROWSING_KEY` | — | Enables Safe Browsing checks (otherwise local blocklist only). |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | — | Enable OAuth sign-in buttons. Callback: `{HDH_BASE_URL}/api/auth/oauth/{google|github}/callback`. |

## Checks

```bash
npm run lint
npm run typecheck
npm test            # unit tests (vitest)
npm run build
npm run test:e2e    # Playwright; starts `next start` on :3200 with a throwaway DB (build first)
```

E2E screenshots go to `evidence/build/`, results to `evidence/test-results/e2e.json`.

## Try the main flows

1. **Guest link**: on `/`, paste `example.com/hello`, open Options, set alias `hello-world`, Shorten. Copy the secret code.
2. **Redirect**: open `http://localhost:3000/hello-world`. Then open its Stats — the click is listed.
3. **Password**: create a link with a password; opening it shows the password gate.
4. **Expiry**: set Expires → 1 Clicks; the second visit shows the expired page.
5. **Account**: Sign up — the guest link joins your account. In the dashboard: search, filter, edit, delete → Trash → Restore, Import/Export.
6. **Bio page**: Dashboard → Bio page, fill the four steps, Save, open `/u/<address>`.
7. **Reset password**: `/forgot-password`, then open the link written to `data/outbox/`.
8. **API**: `curl -X POST localhost:3000/api/links -H 'content-type: application/json' -d '{"originalUrl":"example.com"}'` — see `/docs/api`.

## Docs

- [docs/analysis.md](docs/analysis.md) — reference survey, site map, limits
- [docs/architecture.md](docs/architecture.md) — design, data model, decisions
- [docs/parity.md](docs/parity.md) — feature-by-feature status
- [docs/progress.md](docs/progress.md) — done, blocked, next

## Deploying

Any Node host that keeps a writable disk for the SQLite file works (a single instance; rate limits are in-memory). Set `HDH_BASE_URL` to the public origin and serve behind HTTPS so the session cookie is marked `Secure`. Put it behind a proxy that adds geo headers (`cf-ipcountry` etc.) for accurate countries/cities.
