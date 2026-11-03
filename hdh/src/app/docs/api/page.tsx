import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";
import { baseUrl } from "@/lib/config";

export const metadata: Metadata = { title: "API reference" };
export const dynamic = "force-dynamic";

const ERRORS: [number, string, string][] = [
  [400, "customCodeErr.invalidLength", "Alias length or characters invalid"],
  [400, "customCodeErr.startsWithSymbol", "Alias starts with . _ or -"],
  [400, "customCodeErr.endsWithSymbol", "Alias ends with . _ or -"],
  [400, "customCodeErr.repeatedSymbols", "Two symbols in a row"],
  [400, "validation.originalUrlRequired", "Destination missing"],
  [400, "validation.invalidUrl", "Not a valid http(s) URL with a domain"],
  [400, "validation.urlTooLong", "URL over 2,048 characters"],
  [400, "validation.invalidPasswordLength", "Password empty or over 64 characters"],
  [400, "validation.invalidPasswordChars", "Password contains spaces"],
  [400, "validation.invalidControlMode", "Unknown controlMode"],
  [400, "validation.invalidClickLimit", "Click limit invalid or not above current clicks"],
  [400, "validation.invalidExpiration", "Invalid expiresAt / expireAfter"],
  [400, "validation.invalidExpireMode", "Invalid expireMode on update"],
  [400, "validation.expirationInPast", "Expiry not in the future / not later than current"],
  [400, "validation.expirationTooFar", "Expiry more than 100 years away"],
  [400, "validation.invalidTitle", "title is not a string"],
  [400, "validation.titleTooLong", "title over 200 characters"],
  [401, "auth.invalidSecret", "Secret code missing or wrong"],
  [401, "auth.invalidPassword", "Link password wrong"],
  [401, "auth.passwordRequired", "Link is password-protected"],
  [401, "auth.secretRequired", "Only the owner can manage this link"],
  [401, "auth.noPermission", "Link can't be managed (mode or owner)"],
  [403, "customCodeErr.blockedKeyword", "Alias contains a blocked word"],
  [403, "validation.blacklistedDomain", "Destination is blocked or unsafe"],
  [403, "validation.selfShortenBlocked", "URL points to this shortener"],
  [403, "forbidden.noTracking", "controlMode none has no stats"],
  [403, "link.malicious", "Link blocked as harmful (blockedType)"],
  [404, "notFound.link", "No such short code"],
  [409, "customCodeErr.codeTaken", "Alias in use or reserved"],
  [410, "expired.time", "Time limit passed"],
  [410, "expired.clicks", "Click limit reached"],
  [410, "expired.deleted", "Link was deleted"],
  [429, "rateLimit.tooManyRequests", "Over 120 creation requests in 10 minutes"],
  [429, "rateLimit.dailyLimit", "Daily creation cap reached"],
  [429, "rateLimit.tooManyAttempts", "Too many wrong secrets/passwords; see Retry-After"],
  [500, "server.createFailed", "Couldn't generate a unique code; retry"],
  [500, "server.error", "Unexpected error"],
];

const TOC: [string, string][] = [["basics", "Basics"], ["create-a-link", "Create a link"], ["create-via-get", "Create via GET"], ["statistics", "Statistics"], ["preview", "Preview"], ["update", "Update"], ["delete", "Delete"], ["qr-code", "QR code"], ["total-links", "Total links"], ["rate-limits", "Rate limits"], ["error-keys", "Error keys"]];

export default function ApiDocs() {
  const b = `${baseUrl()}/api`;
  return (
    <DocPage title="API reference" lead="A small JSON API for creating and managing short links." current="/docs/api" toc={TOC}>
      <h2 id="basics">Basics</h2>
      <ul>
        <li>Base URL: <code>{b}</code></li>
        <li>Send JSON with <code>Content-Type: application/json</code>. Invalid JSON is treated as an empty body.</li>
        <li>Responses are JSON (except <code>format=simple</code>). Times are ISO 8601 UTC.</li>
        <li>No API keys. Full-mode links return a <code>secretCode</code> once; send it as <code>secret</code> (query) or <code>secretCode</code> (body) to manage the link.</li>
        <li>Errors look like <code>{`{ "error": "…", "errorKey": "…" }`}</code>. Branch on <code>errorKey</code>, not on the message.</li>
      </ul>

      <h2 id="create-a-link">Create a link</h2>
      <pre>{`POST /api/links
{
  "originalUrl": "example.com/very/long/page",
  "customCode": "my-launch",          // optional, 5–64 chars
  "controlMode": "full",              // full | statsOnly | none
  "password": "s3cret",               // optional, 1–64, no spaces
  "expireMode": "days",               // minutes | hours | days | clicks
  "expireAfter": 7,
  "expiresAt": "2027-01-01T00:00:00Z",// optional, overrides time-based expireMode
  "maxClicks": 1000                   // optional
}`}</pre>
      <p>Returns <code>201</code> for a new link or <code>200</code> when an identical active link is reused (then <code>secretCode</code> and <code>password</code> are <code>null</code>).</p>
      <pre>{`curl -s -X POST ${b}/links -H 'content-type: application/json' \\
  -d '{"originalUrl":"https://example.com"}'`}</pre>

      <h2 id="create-via-get">Create via GET</h2>
      <pre>{`GET /api/links/create?url=<encoded>&custom=<alias>&format=simple`}</pre>
      <p>Always creates <code>controlMode: &quot;none&quot;</code> links. With <code>format=simple</code> the short URL is returned as plain text.</p>

      <h2 id="statistics">Statistics</h2>
      <pre>{`GET /api/links/{code}/stats?secret=…&password=…&mode=redirect`}</pre>
      <p>
        Full links need <code>secret</code> (or the owner&apos;s session). Password-protected Stats only links need <code>password</code>. With{" "}
        <code>mode=redirect</code> only <code>{`{ "originalUrl" }`}</code> is returned. Expired links return <code>410</code> unless the secret or owner is supplied.
      </p>

      <h2 id="preview">Preview</h2>
      <pre>{`GET /api/links/{code}/preview?reveal=1`}</pre>
      <p>Shows the destination without counting a click. <code>reveal=1</code> adds <code>originalUrl</code> to the <code>403</code> body of a blocked link — never auto-redirect to it.</p>

      <h2 id="update">Update</h2>
      <pre>{`PATCH /api/links/{code}
{ "secretCode": "…", "originalUrl": "…", "title": "…", "password": null,
  "expireMode": "never" | "minutes" | "hours" | "days" | "clicks", "expireAfter": 3 }`}</pre>
      <p>Full links only. Only fields you send change. A new time expiry must end later than the current one and clears the click limit; a new click limit clears the time limit and must be above the current clicks.</p>

      <h2 id="delete">Delete</h2>
      <pre>{`POST /api/links/{code}/delete
{ "secretCode": "…" }`}</pre>
      <p>The code stays reserved. Account links can be restored from Trash for 30 days; guest links can&apos;t.</p>

      <h2 id="qr-code">QR code</h2>
      <pre>{`GET /api/links/{code}/qr?format=png|svg&size=512&download=1`}</pre>

      <h2 id="total-links">Total links</h2>
      <pre>{`GET /api/links/stats/total  →  { "total": 1234 }`}</pre>

      <h2 id="rate-limits">Rate limits</h2>
      <ul>
        <li>Creation: 120 requests per rolling 10 minutes per IP (failed validation counts).</li>
        <li>Daily: 300 new links per IP per UTC day; accounts at least 7 days old get 2,000.</li>
        <li>After 30 wrong secrets/passwords in 15 minutes, stats/update/delete return <code>429</code> until the window passes.</li>
        <li>Every <code>429</code> carries a <code>Retry-After</code> header and a <code>retryAfter</code> field.</li>
      </ul>

      <h2 id="error-keys">Error keys</h2>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Status</th><th>errorKey</th><th>Meaning</th></tr></thead>
          <tbody>
            {ERRORS.map(([s, k, m]) => (
              <tr key={k}><td>{s}</td><td><code>{k}</code></td><td>{m}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocPage>
  );
}
