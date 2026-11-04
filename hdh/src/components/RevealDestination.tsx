"use client";

import { useState } from "react";

/** Shows a blocked link's destination as text only; never redirects automatically. */
export function RevealDestination({ code }: { code: string }) {
  const [url, setUrl] = useState<string | null>(null);
  return url ? (
    <p className="mt-4 break-all rounded-lg bg-surface-2 p-3 text-left font-mono text-xs">{url}</p>
  ) : (
    <button
      className="btn-ghost mt-4"
      onClick={async () => {
        const r = await fetch(`/api/links/${encodeURIComponent(code)}/preview?reveal=1`);
        const b = (await r.json()) as { originalUrl?: string };
        setUrl(b.originalUrl ?? "Destination unavailable");
      }}
    >
      Show destination (not recommended)
    </button>
  );
}
