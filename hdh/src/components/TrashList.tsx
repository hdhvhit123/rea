"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ClientApiError, displayUrl, fmtDate } from "@/lib/client";

interface Row { shortCode: string; shortUrl: string; originalUrl: string; deletedAt: string; purgeAt: string; clicks: number }

export function TrashList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setRows((await api<{ links: Row[] }>("/api/dashboard/trash")).links);
      setError(null);
    } catch (e) {
      setError((e as ClientApiError).message);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load
    load();
  }, [load]);
  return (
    <div>
      <h1 className="text-2xl font-bold">Trash</h1>
      <p className="mt-1 text-sm text-ink-2">Deleted links stay here for 30 days. Restore one to make it redirect again. The code stays reserved either way.</p>
      {error && <p role="alert" className="mt-4 text-sm text-bad">{error}</p>}
      {!rows && !error && <p className="mt-6 flex items-center gap-2 text-ink-2" role="status"><span className="spinner" />Loading…</p>}
      {rows && rows.length === 0 && <div className="card mt-6 px-6 py-12 text-center text-ink-2">Trash is empty.</div>}
      {rows && rows.length > 0 && (
        <ul className="mt-6 grid gap-2">
          {rows.map((r) => (
            <li key={r.shortCode} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" data-testid="trash-row">
              <div className="min-w-0">
                <p className="truncate font-semibold">{displayUrl(r.shortUrl)}</p>
                <p className="truncate text-sm text-ink-3">{r.originalUrl}</p>
                <p className="text-xs text-ink-3">Deleted {fmtDate(r.deletedAt)} · removed for good {fmtDate(r.purgeAt)}</p>
              </div>
              <button
                className="btn-ghost btn-sm shrink-0"
                disabled={busy === r.shortCode}
                onClick={async () => {
                  setBusy(r.shortCode);
                  try {
                    await api(`/api/dashboard/links/${encodeURIComponent(r.shortCode)}/restore`, { method: "POST" });
                    await load();
                  } catch (e) {
                    setError((e as ClientApiError).message);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
