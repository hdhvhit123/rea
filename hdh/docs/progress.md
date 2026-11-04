# Progress

_Last updated: 2026-11-03_

## Done

- Surveyed bito.li through text fetch (home, guide, API docs, register). See `analysis.md` for limits.
- Built the full app in `hdh/`: shortening with options, redirect + password gate + expired/blocked pages, stats with charts and breakdowns, QR PNG/SVG, check-a-link, demo stats, accounts (register/login/logout/reset), dashboard (search/filter/sort/paging/create/edit/delete), trash + restore, import/export, settings, bio pages, docs, legal pages, abuse reports, JSON API with error keys and rate limits.
- Checks: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (33 unit), `npm run test:e2e` (38 browser tests incl. 360×800, 768×1024, 1440×900 overflow checks). Screenshots in `evidence/build/`, results in `evidence/test-results/e2e.json`.

- Visual pass (second session): surveyed bito.li public pages at 360/768/1440, measured its tokens, and rebuilt hdh's tokens (Inter + JetBrains Mono, oklch palette, radii, shadows), header, footer, home, auth and docs layouts to match. Home metrics now equal the reference (see `parity.md` F34). Evidence in `evidence/visual/` (hdh captures + measurements).

## Blocked

- **REA screenshot comparison.** bito.li is reachable now, but running `npx rea-agents` was refused by the second session's command policy, so the visual comparison used Playwright screenshots plus computed-style measurements instead (see `analysis.md` → Visual survey).
- **OAuth** (Google/GitHub) needs client credentials to verify.
- **Google Safe Browsing** needs `GOOGLE_SAFE_BROWSING_KEY`.
- **Email delivery** needs a mail provider (currently an outbox folder).

## Next

1. Compare logged-in pages (dashboard, settings, stats) once the owner allows creating a test account on the reference.
2. Optional: dark-mode toggle and language menu (reference has both), show Google/GitHub buttons when OAuth is configured.
3. Optional: run REA `compare-web-screenshots` in a session whose policy allows `npx rea-agents`.
4. Optional: e2e coverage for import UI and email/password change; trash purge job; shared rate-limit store.
