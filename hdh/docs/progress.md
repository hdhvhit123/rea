# Progress

_Last updated: 2026-11-03_

## Done

- Surveyed bito.li through text fetch (home, guide, API docs, register). See `analysis.md` for limits.
- Built the full app in `hdh/`: shortening with options, redirect + password gate + expired/blocked pages, stats with charts and breakdowns, QR PNG/SVG, check-a-link, demo stats, accounts (register/login/logout/reset), dashboard (search/filter/sort/paging/create/edit/delete), trash + restore, import/export, settings, bio pages, docs, legal pages, abuse reports, JSON API with error keys and rate limits.
- Checks: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (33 unit), `npm run test:e2e` (38 browser tests incl. 360×800, 768×1024, 1440×900 overflow checks). Screenshots in `evidence/build/`, results in `evidence/test-results/e2e.json`.

## Blocked

- **Visual survey and comparison with bito.li.** This session's network policy denied `bito.li` (proxy 403; Chromium `ERR_TUNNEL_CONNECTION_FAILED`). REA 6.8.0 is installed and runs, but had no reachable target. The owner enabled `bito.li` in a new cloud environment, which applies to sessions started after the change.
- **OAuth** (Google/GitHub) needs client credentials to verify.
- **Google Safe Browsing** needs `GOOGLE_SAFE_BROWSING_KEY`.
- **Email delivery** needs a mail provider (currently an outbox folder).

## Next

1. In a session that can reach bito.li: start Chromium with a dedicated profile and loopback CDP (`--remote-debugging-address=127.0.0.1`), list targets with REA, then `rea capture-web-screenshot` for each page type at 360/768/1440 (home, register, login, docs, guide, API, demo stats). Read only — no link creation or sign-up on the reference without the owner's permission.
2. Capture the same views of the local build and run `rea compare-web-screenshots`; note excluded dynamic regions.
3. Adjust tokens (font, colours, radii, spacing) and layouts to the measured values; update `parity.md` F34 and the "Visual match" cells.
4. Optional: e2e coverage for import UI and email/password change; trash purge job; shared rate-limit store.
