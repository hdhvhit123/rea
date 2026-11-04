"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ClientApiError, displayUrl, fmtDate } from "@/lib/client";
import { ShortenForm } from "./ShortenForm";
import { CopyButton } from "./CopyButton";
import { QrModal } from "./QrModal";
import { LinkEditForm } from "./ManageLink";
import { ChartIcon, EditIcon, LockIcon, QrIcon, SearchIcon, XIcon } from "./icons";

interface Row {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  controlMode: "full" | "statsOnly" | "none";
  hasPassword: boolean;
  clicks: number;
  qrClicks: number;
  expiresAt: string | null;
  maxClicks: number | null;
  createdAt: string;
  state: string;
}
interface ListResp { total: number; page: number; pageSize: number; links: Row[] }

const FILTERS = [
  ["all", "All links"],
  ["active", "Active"],
  ["expired", "Expired"],
  ["protected", "Password"],
  ["full", "Full"],
  ["statsOnly", "Stats only"],
  ["none", "No tracking"],
];
const SORTS = [
  ["newest", "Newest"],
  ["oldest", "Oldest"],
  ["clicks", "Most clicks"],
  ["alias", "A–Z"],
];

export function LinksDashboard() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [edit, setEdit] = useState<Row | null>(null);
  const [qr, setQr] = useState<Row | null>(null);
  const [tools, setTools] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ q: debounced, filter, sort, page: String(page) });
      const r = await api<ListResp>(`/api/dashboard/links?${qs}`);
      if (id === reqId.current) {
        setData(r);
        setError(null);
      }
    } catch (e) {
      if (id === reqId.current) setError((e as ClientApiError).message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [debounced, filter, sort, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on query change
    load();
  }, [load]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Your links {data && <span className="text-base font-medium text-ink-3">({data.total})</span>}</h1>
        <div className="flex gap-2">
          <button className="btn-ghost" aria-expanded={tools} onClick={() => setTools((v) => !v)}>Import / Export</button>
          <button className="btn-primary" aria-expanded={creating} onClick={() => setCreating((v) => !v)}>{creating ? "Close" : "New link"}</button>
        </div>
      </div>

      {creating && (
        <div className="card animate-pop mt-4 p-4">
          <ShortenForm compact signedIn onCreated={() => { setPage(1); load(); }} />
        </div>
      )}
      {tools && <ImportExport onImported={load} />}

      <div className="mt-5 flex flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" width={16} height={16} />
          <label htmlFor="dash-q" className="sr-only">Search links</label>
          <input id="dash-q" type="search" className="input pl-9" placeholder="Search by alias, destination or title" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <label className="sr-only" htmlFor="dash-filter">Filter</label>
        <select id="dash-filter" className="input md:w-44" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          {FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="sr-only" htmlFor="dash-sort">Sort</label>
        <select id="dash-sort" className="input md:w-40" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {error && (
        <div role="alert" className="mt-4 flex items-center justify-between rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">
          {error}
          <button className="btn-ghost btn-sm" onClick={load}>Retry</button>
        </div>
      )}

      <div className="mt-4" aria-busy={loading}>
        {!data && loading && <p className="flex items-center gap-2 py-10 text-ink-2" role="status"><span className="spinner" />Loading links…</p>}
        {data && data.links.length === 0 && (
          <div className="card px-6 py-14 text-center">
            <p className="font-semibold">{debounced || filter !== "all" ? "No links match" : "No links yet"}</p>
            <p className="mt-1 text-sm text-ink-2">{debounced || filter !== "all" ? "Try another search or filter." : "Create your first short link to see it here."}</p>
            {!debounced && filter === "all" && <button className="btn-primary mt-4" onClick={() => setCreating(true)}>New link</button>}
          </div>
        )}
        {data && data.links.length > 0 && (
          <ul className={`grid gap-2 ${loading ? "opacity-60" : ""}`}>
            {data.links.map((r) => (
              <li key={r.shortCode} className="card p-4" data-testid="dash-row">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={r.shortUrl} target="_blank" rel="noreferrer" className="truncate font-semibold text-brand">{displayUrl(r.shortUrl)}</a>
                      {r.state !== "active" && <span className="chip border-warn/40 text-warn">{r.state}</span>}
                      {r.hasPassword && <span className="chip"><LockIcon width={11} height={11} />Password</span>}
                      {r.controlMode !== "full" && <span className="chip">{r.controlMode === "none" ? "No tracking" : "Stats only"}</span>}
                    </div>
                    {r.title && <p className="truncate text-sm font-medium">{r.title}</p>}
                    <p className="truncate text-sm text-ink-3" title={r.originalUrl}>{r.originalUrl}</p>
                    <p className="mt-1 text-xs text-ink-3">
                      {r.clicks.toLocaleString()} clicks · {r.qrClicks.toLocaleString()} QR · created {fmtDate(r.createdAt)}
                      {r.expiresAt ? ` · expires ${fmtDate(r.expiresAt)}` : r.maxClicks ? ` · limit ${r.maxClicks.toLocaleString()} clicks` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <CopyButton text={r.shortUrl} />
                    <button className="btn-ghost btn-sm" onClick={() => setQr(r)} aria-label={`QR code for ${r.shortCode}`}><QrIcon width={14} height={14} /></button>
                    {r.controlMode !== "none" && <Link className="btn-ghost btn-sm" href={`/d/${r.shortCode}`}><ChartIcon width={14} height={14} />Stats</Link>}
                    {r.controlMode === "full" && <button className="btn-ghost btn-sm" onClick={() => setEdit(r)}><EditIcon width={14} height={14} />Edit</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-center gap-2">
          <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-sm text-ink-2">Page {page} of {pages}</span>
          <button className="btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </nav>
      )}

      {edit && (
        <Modal title={`Edit /${edit.shortCode}`} onClose={() => setEdit(null)}>
          <LinkEditForm
            link={edit}
            secret={null}
            onSaved={() => { load(); setEdit(null); }}
            onDeleted={() => { setEdit(null); load(); }}
            onCancel={() => setEdit(null)}
          />
        </Modal>
      )}
      {qr && <QrModal code={qr.shortCode} shortUrl={qr.shortUrl} onClose={() => setQr(null)} />}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  return (
    <dialog ref={ref} onClose={onClose} aria-label={title} className="m-auto w-[min(94vw,640px)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/40">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="font-bold">{title}</h2>
        <button className="btn-ghost px-2" aria-label="Close" onClick={() => ref.current?.close()}><XIcon /></button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

function ImportExport({ onImported }: { onImported: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ code: string; ok: boolean; reason?: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="card animate-pop mt-4 grid gap-6 p-4 md:grid-cols-2">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const r = await api<{ results: { code: string; ok: boolean; reason?: string }[] }>("/api/dashboard/import", { method: "POST", json: { text } });
            setResults(r.results);
            onImported();
          } catch (e) {
            setError((e as ClientApiError).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-semibold">Import links</h2>
        <p className="mt-1 text-sm text-ink-2">One per line: short code or short URL, then its secret code. Up to 50 at a time. Only Full links that don&apos;t belong to another account can be imported.</p>
        <label htmlFor="import-text" className="sr-only">Links to import</label>
        <textarea id="import-text" className="input mt-3 h-28 font-mono text-xs" placeholder={"my-launch 9xQ…secret\nhttps://hdh.link/abc123 7Lm…secret"} value={text} onChange={(e) => setText(e.target.value)} />
        {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
        <button className="btn-primary mt-3" disabled={busy || !text.trim()}>{busy ? "Importing…" : "Import"}</button>
        {results && (
          <ul className="mt-3 space-y-1 text-sm" aria-live="polite">
            {results.map((r, i) => (
              <li key={i} className={r.ok ? "text-ok" : "text-bad"}>{r.ok ? "✓" : "✕"} {r.code} {r.reason ? `— ${r.reason}` : ""}</li>
            ))}
          </ul>
        )}
      </form>
      <div>
        <h2 className="font-semibold">Export links</h2>
        <p className="mt-1 text-sm text-ink-2">Download all your links. Exports include secret codes — keep the files private.</p>
        <div className="mt-3 flex gap-2">
          <a className="btn-ghost" href="/api/dashboard/export?format=csv" download>CSV</a>
          <a className="btn-ghost" href="/api/dashboard/export?format=json" download>JSON</a>
        </div>
      </div>
    </div>
  );
}
