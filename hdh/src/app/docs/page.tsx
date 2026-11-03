import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";

export const metadata: Metadata = { title: "Documentation" };

export default function Docs() {
  return (
    <DocPage title="Documentation" lead="Everything you need to shorten, manage and measure links with hdh." current="/docs">
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/docs/guide" className="card block p-5 no-underline hover:shadow-md">
          <p className="font-semibold text-ink">User guide</p>
          <p className="mt-1 text-sm text-ink-2">Aliases, expiry, passwords, privacy modes, secret codes, QR codes, the dashboard and bio pages.</p>
        </Link>
        <Link href="/docs/api" className="card block p-5 no-underline hover:shadow-md">
          <p className="font-semibold text-ink">API reference</p>
          <p className="mt-1 text-sm text-ink-2">Create links, read statistics, preview, update and delete over a small JSON API.</p>
        </Link>
      </div>
      <h2>Quick start</h2>
      <ul>
        <li>Paste a long link on the <Link href="/">home page</Link> and press Shorten.</li>
        <li>Open <strong>Options</strong> for an alias, expiry, password or privacy mode.</li>
        <li>Copy the short link, download its QR code, or open its stats page.</li>
      </ul>
    </DocPage>
  );
}
