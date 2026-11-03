import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";

export const metadata: Metadata = { title: "User guide" };

export default function Guide() {
  return (
    <DocPage title="User guide" lead="How each feature works and the rules behind it." current="/docs/guide">
      <h2 id="create">Creating a short link</h2>
      <ul>
        <li>Paste a long address on the home page. You can leave out <code>https://</code>.</li>
        <li>Open <strong>Options</strong> to set a custom alias, expiry, password or privacy mode.</li>
        <li>After shortening you can copy the link, open it, show its QR code or go to its stats.</li>
        <li>Links you make appear under <strong>Recent links</strong> on this device only. Clearing that list does not delete the links.</li>
        <li>Shortening the same address with the same settings gives you the existing link back.</li>
        <li>Links to hdh itself and to blocked destinations can&apos;t be shortened.</li>
      </ul>

      <h2 id="alias">Custom aliases</h2>
      <ul>
        <li>5–64 characters: letters, digits, dots, underscores and hyphens.</li>
        <li>No symbol at the start or end, and never two symbols in a row.</li>
        <li>Names used by the site (for example <code>login</code>, <code>docs</code>) are reserved.</li>
        <li>First come, first served. Aliases are not case-sensitive.</li>
      </ul>

      <h2 id="password">Passwords</h2>
      <ul>
        <li>Up to 64 characters, no spaces.</li>
        <li>Visitors enter the password before they are redirected.</li>
        <li>For <strong>Stats only</strong> links, the password also unlocks the stats page. For <strong>Full</strong> links, stats need the secret code instead.</li>
      </ul>

      <h2 id="expiry">Expiry and click limits</h2>
      <ul>
        <li>Choose Never, a span in minutes, hours or days, or a click limit up to 100,000,000.</li>
        <li>Once expired, visitors see an “expired” page instead of the destination.</li>
        <li>Full links can be extended later, even after they expired. A new time limit replaces a click limit and the other way round.</li>
      </ul>

      <h2 id="modes">Privacy modes</h2>
      <table>
        <thead><tr><th>Mode</th><th>Statistics</th><th>Edit / delete</th></tr></thead>
        <tbody>
          <tr><td>Full (default)</td><td>With secret code or account</td><td>With secret code or account</td></tr>
          <tr><td>Stats only</td><td>Public (password if set)</td><td>Account owner only</td></tr>
          <tr><td>None</td><td>Not collected</td><td>Not possible</td></tr>
        </tbody>
      </table>
      <p>The mode is chosen when the link is created and can&apos;t be changed.</p>

      <h2 id="secret">Secret codes</h2>
      <p>
        Full links get a secret code. It&apos;s shown once, right after creation, and works like a key: view stats, change the destination, password or
        expiry, or delete the link. hdh can&apos;t recover it. It&apos;s also saved in Recent links on the device you used.
      </p>

      <h2 id="stats">Statistics</h2>
      <p>
        Open stats from the Stats button or at <code>/d/&lt;code&gt;</code>. You&apos;ll see total clicks and QR scans, clicks per day for 30 days, countries and
        cities, devices, browsers, operating systems, referrers and the latest clicks. <Link href="/d/demo">See the demo</Link>.
      </p>

      <h2 id="qr">QR codes</h2>
      <p>Every link has a QR code. Download PNG for screens and documents or SVG for print. Scans are counted separately from regular clicks.</p>

      <h2 id="bio">Bio page</h2>
      <p>With an account you can publish one page that gathers your links at <code>/u/&lt;your-name&gt;</code>: choose the address, add your profile and links, pick a design and check the preview.</p>

      <h2 id="account">Account and dashboard</h2>
      <ul>
        <li>Sign up with email (and Google or GitHub when the server enables them) to manage links on any device.</li>
        <li>The dashboard has search, filters, sorting and pagination, and lets you create, edit and delete links.</li>
        <li>Deleted links go to <strong>Trash</strong> and can be restored for 30 days.</li>
        <li><strong>Settings</strong> lets you change your email or password and sign out other sessions.</li>
      </ul>

      <h2 id="import">Import and export</h2>
      <ul>
        <li>Guest links on this device are added to your account automatically when you sign in.</li>
        <li>Use <strong>Import</strong> for links made elsewhere: one short code (or URL) and its secret code per line, up to 50 at a time. Only Full links not owned by another account qualify.</li>
        <li><strong>Export</strong> downloads all your links as CSV or JSON. Exports contain secret codes — keep them private.</li>
      </ul>

      <h2 id="safety">Safety</h2>
      <p>Destinations are checked against a blocklist and, when configured, Google Safe Browsing. Harmful links show a warning instead of redirecting. <Link href="/abuse">Report abuse</Link>.</p>
    </DocPage>
  );
}
