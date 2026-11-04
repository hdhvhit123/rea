"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { displayUrl, readRecent, writeRecent, type RecentLink } from "@/lib/client";
import { CopyButton } from "./CopyButton";
import { QrModal } from "./QrModal";
import { ChartIcon, QrIcon } from "./icons";

export function RecentLinks() {
  const [list, setList] = useState<RecentLink[] | null>(null);
  const [qr, setQr] = useState<RecentLink | null>(null);
  useEffect(() => {
    const load = () => setList(readRecent());
    load();
    window.addEventListener("hdh-recent", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("hdh-recent", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  if (!list || list.length === 0) return null;
  return (
    <section aria-labelledby="recent-title" className="card mt-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="recent-title" className="text-sm font-semibold">Recent links <span className="font-normal text-ink-3">· on this device</span></h2>
        <button
          type="button"
          className="text-xs font-medium text-ink-3 hover:text-bad"
          onClick={() => {
            if (confirm("Clear the list on this device? The links keep working. Secret codes stored here will be removed.")) writeRecent([]);
          }}
        >
          Clear list
        </button>
      </div>
      <ul className="mt-2 divide-y divide-line">
        {list.slice(0, 8).map((r) => (
          <li key={r.code} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <a href={r.shortUrl} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold text-brand">{displayUrl(r.shortUrl)}</a>
              <p className="truncate text-xs text-ink-3" title={r.originalUrl}>{r.originalUrl}</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <CopyButton text={r.shortUrl} />
              <button type="button" className="btn-ghost btn-sm" onClick={() => setQr(r)} aria-label={`QR code for ${r.code}`}><QrIcon width={14} height={14} /></button>
              {r.controlMode !== "none" && (
                <Link className="btn-ghost btn-sm" href={`/d/${r.code}`} aria-label={`Stats for ${r.code}`}><ChartIcon width={14} height={14} />Stats</Link>
              )}
            </div>
          </li>
        ))}
      </ul>
      {qr && <QrModal code={qr.code} shortUrl={qr.shortUrl} onClose={() => setQr(null)} />}
    </section>
  );
}
