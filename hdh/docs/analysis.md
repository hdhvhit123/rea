# Survey of the reference site (bito.li)

Survey date: 2026-11-03. Reference: https://bito.li/ (a link shortener).

## How the survey was done, and its limits

| Method | Result |
|---|---|
| `curl https://bito.li/` from the build container | **Blocked.** The container's egress proxy answered `403` to `CONNECT bito.li:443` (policy denial). |
| Playwright/Chromium `page.goto("https://bito.li/")` | **Blocked.** `net::ERR_TUNNEL_CONNECTION_FAILED`. |
| REA (`npx rea-agents@latest`, v6.8.0) | **Installed and runs** (`rea --help` lists `capture-web-screenshot`, `capture-browser-scenario`, `analyze-web-bundle`, `compare-web-screenshots`, …). Its browser tools need a CDP target that can load the page, which the network block prevented. **No REA observation of bito.li was made.** |
| Text fetch tool (server-side fetch, converted to text) | **Worked** for `/`, `/docs/guide`, `/docs/api`, `/register`. `/d/demo` and `/page` were refused by the site's `robots.txt`. |

Consequences:

- Everything below is **observed as text** (headings, labels, copy structure, documented rules). There are **no screenshots, CSS measurements, fonts, colours (except the `theme-color` meta `#fbfbfe`), spacing, animations, network traces or bundles** from the reference.
- Visual design in the build is therefore **original** (hdh's own tokens), only the information architecture and behaviour follow the reference.
- The owner has since enabled `bito.li` in a new cloud environment; it applies to sessions started after the change. A follow-up session should run REA's browser observation and screenshot comparison (see `docs/progress.md`).

Legend used below: **[O]** observed in fetched text · **[D]** documented by the site's own docs (observed text, but behaviour not exercised) · **[I]** inferred · **[U]** unverified.

## Site map

| Route | Status | Notes |
|---|---|---|
| `/` | [O] | Home: header, hero + shorten form, preview card, trust bullets, How it works, demo CTA, Features (8 cards), Free account + Guest vs Free table, Check a short link, migration note (lnk.ink → bito.li), FAQ (8), closing CTA, footer. |
| `/docs` | [O] link | Docs index (content not fetched). |
| `/docs/guide` | [O] | User guide (rules summarised below). |
| `/docs/api` | [O] | API reference (endpoints, fields, error keys, rate limits). |
| `/d/{code}` (e.g. `/d/demo`) | [D] | Stats page. Fetch refused by robots.txt; contents taken from the guide/API docs. |
| `/page` | [D] | Bio page editor (account). Fetch refused by robots.txt. |
| `/u/{name}`, `{name}.bito.li` | [D] | Public bio page. |
| `/register` | [O] | "Create your account", Google + email, password ≥ 8, Terms/Privacy notice, promo panel "Every link, measured". |
| `/login`, `/forgot-password` | [O] link | Linked from footer/register; contents not fetched. |
| `/terms`, `/privacy`, `/abuse` | [O] link | Not fetched. |
| `/{code}` | [D] | Redirect; password gate; expired page; blocked warning. |
| Dashboard, Trash, Settings | [D] | Described in the guide; URLs not observed ([I] `/dashboard…`). |

## Features observed or documented

- **Shorten** [O/D]: URL field (scheme optional), Shorten button, "/" focuses the input, Options panel (custom alias, expiry, password; privacy mode Full/Stats only/None). Identical URL+settings returns the existing link. Self-links and blocklisted sites rejected.
- **Result** [D]: copy, open, QR; secret code shown once for Full links; Recent links list on this device (clearing doesn't delete links; secrets saved there).
- **Alias rules** [D]: 5–64 chars, letters/digits/`.`/`_`/`-`, no leading/trailing symbol, no consecutive symbols, reserved words, first come first served.
- **Password** [D]: ≤ 64 chars, no spaces; visitors enter it before redirect; unlocks stats for Stats only links.
- **Expiry** [D]: Never, minutes/hours/days, or clicks ≤ 100,000,000; expired page; Full links extendable later.
- **Modes** [D]: Full (secret/owner for stats+edit), Stats only (public stats; owner edits), None (no stats/management). Fixed at creation.
- **Stats** [D]: total clicks, QR scans, clicks/day for 30 days, countries, cities, devices, browsers, OS, referrers, recent clicks.
- **QR** [D]: PNG and SVG; scans counted separately.
- **Accounts** [O/D]: email, Google, GitHub; dashboard with search/filter/sort/create/edit/delete; Trash 30 days; Settings (email, password, connect providers, sign out other sessions); guest links auto-claimed on sign-in; Import (code + secret per line, ≤ 50); Export CSV/JSON incl. secrets.
- **Bio page** [D]: choose address, profile, links, design, preview.
- **Safety** [D]: blocklists + Google Safe Browsing; warning page; abuse form.
- **API** [D]: see `docs/api` route in the app (mirrors the documented contract: create POST/GET, stats, preview, PATCH update, POST delete, total; error keys; rate limits 120/10 min, 300/day, 30 failed credentials/15 min, `Retry-After`).

## Not reached / out of scope

- Visual details of every page (blocked network).
- Logged-in areas of the reference (no account was created there; creating data on the reference requires the owner's permission).
- `/d/demo` and `/page` pages (robots.txt).
- The lnk.ink migration section is brand history of the reference and has no equivalent for hdh, so it was intentionally not rebuilt.
