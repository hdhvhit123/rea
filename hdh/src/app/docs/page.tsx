import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";
import { BoltIcon, BookIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Documentation" };

export default function Docs() {
  return (
    <DocPage title="Build with hdh" lead="Everything you need to shorten links, read click statistics and manage your links, whether you use the website or call the JSON API from your own code." current="/docs">
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/docs/api" className="card block p-6 no-underline hover:shadow-lift">
          <span className="icon-tile h-10 w-10"><BoltIcon /></span>
          <p className="mt-4 text-lg font-semibold text-ink">API reference</p>
          <p className="mt-1 text-sm leading-6 text-ink-3">Create links, read statistics, preview, update and delete over a small JSON API.</p>
          <p className="mt-4 text-sm font-medium text-brand">Read the reference →</p>
        </Link>
        <Link href="/docs/guide" className="card block p-6 no-underline hover:shadow-lift">
          <span className="icon-tile h-10 w-10"><BookIcon /></span>
          <p className="mt-4 text-lg font-semibold text-ink">User guide</p>
          <p className="mt-1 text-sm leading-6 text-ink-3">Aliases, expiry, passwords, privacy modes, secret codes, QR codes, the dashboard and bio pages.</p>
          <p className="mt-4 text-sm font-medium text-brand">Open the guide →</p>
        </Link>
      </div>
      <h2 className="!border-t-0 !pt-0">Quick start</h2>
      <ul>
        <li>Paste a long link on the <Link href="/">home page</Link> and press Shorten.</li>
        <li>Open <strong>Options</strong> for an alias, expiry, password or privacy mode.</li>
        <li>Copy the short link, download its QR code, or open its stats page.</li>
      </ul>
    </DocPage>
  );
}
