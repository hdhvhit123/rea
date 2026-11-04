# Parity table

Evidence: **T** = reference text fetched on 2026-11-03 (see `analysis.md`); **D** = reference docs (guide/API) text. **V** = visual survey of the reference on 2026-11-03 (Playwright screenshots at 360/768/1440 and computed-style measurements of public pages; see `analysis.md` → Visual survey and `evidence/visual/`). Visual rows were checked for the public pages listed there; logged-in pages of the reference were not seen.
Tests: `U` = `tests/unit/*.test.ts`, `E` = `tests/e2e/flows.spec.ts`, `R` = `tests/e2e/responsive.spec.ts`. All listed tests passed on 2026-11-03 after the visual pass (33 unit, 38 e2e).

| ID | Feature | Evidence | Implementation | Tests | Status | Missing |
|---|---|---|---|---|---|---|
| F01 | Shorten form, scheme optional, "/" shortcut | T home, V | `components/ShortenForm.tsx`, `POST /api/links` | U normalizeUrl; E guest flow, validation | Done | — |
| F02 | Options: alias, expiry (min/h/d/clicks), password, privacy mode | T home, D guide | `ShortenForm`, `lib/validation.ts` | U alias/expiry/password; E guest flow | Done | — |
| F03 | Alias rules + reserved + conflicts | D guide/API | `validateCustomCode`, `createLink` | U table of cases; E duplicate alias | Done | — |
| F04 | Reuse identical link (200, no secret) | D API | `createLink` dedupe | U create | Done | — |
| F05 | Result: copy, open, QR, stats, secret shown once | D guide | `ShortenForm` result view | E guest flow, R result fit | Done | — |
| F06 | Recent links on device (with secret), clear list | D guide | `RecentLinks.tsx`, `lib/client.ts` | E guest flow | Done | — |
| F07 | Redirect + click counting, QR scans separate | D guide | `app/[code]/route.ts`, `recordClick` | U clicks; E guest flow | Done | Real geo needs edge headers |
| F08 | Password gate | D guide | `app/go/[code]`, `POST /api/go/{code}` | U gate; E password gate | Done | — |
| F09 | Expired (time/clicks) and deleted pages | D guide/API | `go/[code]` page, `linkState` | U clicks; E expiry page | Done | — |
| F10 | Blocked link warning, reveal without redirect | D guide/API | `safety.ts`, `go/[code]`, `RevealDestination` | U blocklist | Done (blocklist); Safe Browsing env-gated | Safe Browsing untested (no key) |
| F11 | Stats page: totals, 30-day chart, countries/cities, devices, browsers, OS, referrers, recent clicks | D guide/API | `StatsView.tsx`, `buildStats` | U stats; E guest flow, demo | Done | Reference layout not seen |
| F12 | Stats access rules (secret / password / owner / none) | D API | `getStats` | U stats access; E stats lock | Done | — |
| F13 | Demo stats page `/d/demo` | T home link | `lib/demo.ts` | E demo | Done (sample data, labelled) | Reference page not fetched (robots) |
| F14 | QR PNG/SVG download | D guide | `GET /api/links/{code}/qr`, `QrModal` | E api contract | Done | — |
| F15 | Manage link: destination, title, password, expiry, delete | D guide/API | `ManageLink.tsx`, `updateLink`, `deleteLink` | U update/delete; E manage + dashboard edit | Done | — |
| F16 | Check a short link | T home | `CheckLinkForm.tsx` | E check link | Done | — |
| F17 | Register / login / logout | T register | `AuthForm.tsx`, `/api/auth/*` | E account flow | Done | — |
| F18 | Forgot / reset password | T footer link | `ResetForms.tsx`, `/api/auth/forgot|reset`, `mail.ts` | E reset flow | Done (outbox demo mode) | Real mail provider |
| F19 | Google / GitHub sign-in | T register, D guide | `lib/oauth.ts`, `/api/auth/oauth/*` | — | Implemented, **unverified** | OAuth credentials |
| F20 | Claim guest links on sign-in | D guide | `claimGuestLinks`, `/api/dashboard/claim` | U claim; E account flow | Done | — |
| F21 | Dashboard: list, search, filter, sort, paging, create | D guide | `LinksDashboard.tsx`, `listUserLinks` | U listing; E account flow; R dashboard | Done | — |
| F22 | Trash (30 days) + restore | D guide/API | `TrashList.tsx`, `listTrash`, `restoreLink` | U trash; E account flow | Done | Purge job (rows past 30 days are hidden, not deleted) |
| F23 | Import (code + secret, ≤ 50) | D guide | `ImportExport`, `/api/dashboard/import` | U parse/claim | Done | E2E for import UI |
| F24 | Export CSV / JSON | D guide | `/api/dashboard/export` | U csv; E CSV download | Done | — |
| F25 | Settings: email, password, connected accounts, sign out others | D guide | `SettingsPanel.tsx`, `/api/auth/*` | E sign out others | Done | E2E for email/password change |
| F26 | Bio page editor (address, profile, links, design, preview) + public page | D guide | `BioEditor.tsx`, `BioView.tsx`, `/u/[handle]`, `/api/bio` | E bio page | Done | Subdomain addresses |
| F27 | API: create POST/GET, stats, preview, PATCH, delete, total, error keys | D API | `src/app/api/links/**` | U services; E api contract | Done | — |
| F28 | Rate limits 120/10 min, 300/day (2,000 for 7-day accounts), 30 failed creds/15 min, Retry-After | D API | `lib/ratelimit.ts`, `http.ts` | U burst + lockout | Done (in-memory) | Multi-instance store |
| F29 | Docs: index, guide, API reference | T links | `app/docs/**` | R docs pages | Done (own text) | — |
| F30 | Terms, Privacy, Report abuse | T footer | `app/terms`, `app/privacy`, `app/abuse`, `/api/abuse` | E abuse form | Done (placeholder legal text) | Legal review |
| F31 | Header nav (Features, How it works, Check a link, Docs, language), mobile menu | T home, V | `SiteHeader`, `MobileMenu` | R navigation ×3 | Done | Language switching and dark-mode toggle (reference has both; hdh shows EN only and follows the system theme) |
| F32 | Home sections: hero, preview, trust, how, demo CTA, features, account + table, check, FAQ, CTA, footer | T home, V | `app/page.tsx` | R home ×3 | Done | lnk.ink migration card replaced by an hdh "Know where you land" card |
| F33 | Responsive 360 / 768 / 1440, no horizontal overflow | brief | all pages | R (24 checks) | Done | — (compared with the reference at all three sizes) |
| F34 | Visual parity with reference (layout, fonts, colours, spacing) | V (home, register, login, docs, guide, API at 360/768/1440) | `app/globals.css` tokens; `SiteHeader`, `SiteFooter`, `ShortenForm`, `app/page.tsx`, `AuthLayout`, `DocPage` | R ×24 overflow; measurement script (`evidence/visual/measurements.json`) | **Done for public pages** | Measured equal on home: font (Inter), colours, h1/h2 size/weight/tracking, eyebrow, input and Shorten button size/radius, header buttons. Remaining differences: page height at 360 (+8%, hdh copy is longer), dashboard/stats/bio pages not compared (reference needs login or is disallowed by robots.txt), no dark-mode toggle, no Google/GitHub buttons on auth pages unless OAuth is configured |
