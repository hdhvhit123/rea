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

- Logged-in areas of the reference (no account was created there; creating data on the reference requires the owner's permission).
- `/d/demo` and `/page` pages (robots.txt).
- The lnk.ink migration section is brand history of the reference and has no equivalent for hdh, so it was intentionally not rebuilt.

## Visual survey (2026-11-03, second session)

Access: `https://bito.li/` answered 200 from the new environment. Read-only: only public pages were opened; nothing was submitted, no account or link was created. `robots.txt` disallows `/d/`, `/page`, `/dashboard`, `/settings`, `/api/` and those were not opened.

Method: Playwright (Chromium) full-page screenshots of `/`, `/register`, `/login`, `/docs`, `/docs/guide`, `/docs/api` at 360×800, 768×1024 and 1440×900 (light scheme, reduced motion), plus `getComputedStyle` on key elements and the stylesheet's `:root` tokens. The same captures were taken of the local build. REA's `compare-web-screenshots` could not be used here: running `npx rea-agents` was refused by this session's command policy, so comparison was done by side-by-side images and a property-by-property measurement table (`evidence/visual/measurements.json`). Dynamic regions (live "links shortened" counter, example chart data, language/theme controls) were excluded from comparison.

Observed design [O]:

| Token | Reference value |
|---|---|
| Font | Inter (UI), JetBrains Mono (code/aliases); body 16/24, letter-spacing −0.006em |
| Colours | bg `oklch(98.8% .0025 280)`, ink `oklch(20% .012 280)`, ink-2 `oklch(37% …)`, muted `oklch(52% …)`, line `oklch(91.8% .005 280)`, brand `oklch(53% .235 279)`, accent `oklch(74% .14 215)` (headline gradient brand→accent) |
| Radii | 6 / 8 / 10 / 14 / 18 / 24 px |
| Shadows | card, lift, brand (three-layer, indigo-tinted) |
| Header | 64 px, transparent over hero on home, sticky with border on other pages; dark "Sign up" button 36 px |
| Hero | centred, h1 46.4 px / 600 / −0.035em (30.4 px on mobile); form card 768 px, radius 18, input and button 56 px radius 14 |
| Sections | eyebrow 12 px / 600 / 0.12em; h2 41.6 px / 600 (30 px mobile); container 1120 px |
| Layout | browser-frame stats preview; 4-cell trust strip; 3-step "How it works" with numbered circles; bento feature grid; Guest/Free table with highlighted column; FAQ in two columns; dark indigo CTA; four-column footer |
| Docs | grid-pattern hero with eyebrow, tabs (Overview / API reference / User guide), left "on this page" list |
| Auth | form on the left, tall gradient promo panel on the right |

Result of the comparison on the home page (hdh vs reference): font, all listed colours, h1/h2/eyebrow metrics, input and button sizes and radii, header button sizes are equal at all three sizes; page height 6219 vs 6176 px at 1440, 8255 vs 8128 at 768, 10740 vs 9920 at 360 (hdh texts are longer). No horizontal overflow on any captured page. Reference screenshots and side-by-side images are kept in the project files folder (`hdh-visual/`), not in the repository, because they contain the reference's branding.
