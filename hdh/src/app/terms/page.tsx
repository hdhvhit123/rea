import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Terms() {
  return (
    <DocPage title="Terms of Service" lead="Plain-language rules for using hdh. Placeholder text — have it reviewed before going live.">
      <h2>Using the service</h2>
      <p>You may shorten links to content you are allowed to share. You are responsible for the links you create and where they lead.</p>
      <h2>Not allowed</h2>
      <ul>
        <li>Phishing, malware, scams or links that impersonate others.</li>
        <li>Spam, or using short links to hide abusive destinations.</li>
        <li>Content that is illegal where you or your visitors are.</li>
        <li>Attempts to overload, scrape or bypass limits of the service.</li>
      </ul>
      <h2>Our rights</h2>
      <p>We may block, disable or delete links that break these rules or put visitors at risk, and limit accounts that abuse the service.</p>
      <h2>No warranty</h2>
      <p>The service is provided as is. We do our best to keep links working but can&apos;t guarantee uninterrupted availability.</p>
      <p>Questions or reports: <Link href="/abuse">Report abuse</Link>.</p>
    </DocPage>
  );
}
