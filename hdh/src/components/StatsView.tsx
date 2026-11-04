"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ClientApiError, displayUrl, fmtDate, readRecent, secretFor, writeRecent } from "@/lib/client";
import { CopyButton } from "./CopyButton";
import { QrModal } from "./QrModal";
import { ManageLink } from "./ManageLink";
import { ExternalIcon, LockIcon, QrIcon } from "./icons";

interface Counted { label: string; count: number }
export interface Stats {
  shortCode: string;
  originalUrl: string;
  title: string | null;
  shortUrl: string;
  clicks: number;
  qrClicks: number;
  createdAt: string;
  expiresAt: string | null;
  maxClicks: number | null;
  controlMode: "full" | "statsOnly" | "none";
  hasPassword: boolean;
  isOwner: boolean;
  state: string;
  expiredReason?: string;
  stats: {
    engagementsOverTime: { date: string; clicks: number; qrClicks: number }[];
    topPerformingDate: { date: string; clicks: number } | null;
    topCountries: Counted[];
    topPlatforms: Counted[];
    topReferrers: Counted[];
    deviceStats: Counted[];
    browserStats: Counted[];
    allCountries: Counted[];
    allCities: Counted[];
    recentClicks: { timestamp: string; isQr: boolean; country: string; city: string; device: string; browser: string; os: string; referrer: string }[];
  };
}
interface Preview {
  shortCode: string;
  originalUrl?: string;
  controlMode: "full" | "statsOnly" | "none";
  passwordProtected: boolean;
  expired?: boolean;
  reason?: string;
  createdAt: string;
}

type Phase =
  | { k: "loading" }
  | { k: "notfound" }
  | { k: "blocked"; type: string }
  | { k: "deleted" }
  | { k: "notracking"; preview: Preview }
  | { k: "locked"; preview: Preview; need: "secret" | "password"; error?: string }
  | { k: "ready"; stats: Stats; secret: string | null }
  | { k: "error"; msg: string };

const regionName = (() => {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return (c: string) => (/^[A-Z]{2}$/.test(c) ? dn.of(c) ?? c : c);
  } catch {
    return (c: string) => c;
  }
})();

export function StatsView({ code, isDemo }: { code: string; isDemo: boolean }) {
  const [phase, setPhase] = useState<Phase>({ k: "loading" });
  const [busy, setBusy] = useState(false);
  const [cred, setCred] = useState("");

  const load = useCallback(
    async (opts: { secret?: string | null; password?: string | null } = {}) => {
      const enc = encodeURIComponent(code);
      let preview: Preview;
      try {
        preview = await api<Preview>(`/api/links/${enc}/preview`);
      } catch (e) {
        const ce = e as ClientApiError;
        if (ce.status === 404) return setPhase({ k: "notfound" });
        if (ce.errorKey === "link.malicious") return setPhase({ k: "blocked", type: String(ce.body.blockedType ?? "unsafe") });
        if (ce.errorKey === "expired.deleted") return setPhase({ k: "deleted" });
        return setPhase({ k: "error", msg: ce.message });
      }
      if (preview.controlMode === "none") return setPhase({ k: "notracking", preview });
      const secret = opts.secret ?? (typeof window !== "undefined" ? new URLSearchParams(location.search).get("secret") : null) ?? secretFor(code);
      const qs = new URLSearchParams();
      if (secret && preview.controlMode === "full") qs.set("secret", secret);
      if (opts.password) qs.set("password", opts.password);
      try {
        const stats = await api<Stats>(`/api/links/${enc}/stats?${qs}`);
        setPhase({ k: "ready", stats, secret: preview.controlMode === "full" ? secret : null });
        if (secret && opts.secret) {
          const list = readRecent();
          const idx = list.findIndex((r) => r.code.toLowerCase() === code.toLowerCase());
          if (idx >= 0) {
            list[idx] = { ...list[idx], secretCode: secret };
            writeRecent(list);
          }
        }
      } catch (e) {
        const ce = e as ClientApiError;
        if (ce.status === 401 || ce.status === 429) {
          const need = preview.controlMode === "full" ? "secret" : "password";
          const attempted = Boolean(opts.secret || opts.password);
          return setPhase({ k: "locked", preview, need, error: attempted || ce.status === 429 ? ce.message : undefined });
        }
        if (ce.status === 410) return setPhase({ k: "locked", preview, need: "secret", error: "This link has expired. Enter its secret code to see the stats." });
        setPhase({ k: "error", msg: ce.message });
      }
    },
    [code],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load();
  }, [load]);

  if (phase.k === "loading")
    return (
      <div className="flex items-center gap-2 py-24 text-ink-2" role="status">
        <span className="spinner" /> Loading stats…
      </div>
    );
  if (phase.k === "notfound")
    return <Notice title="Link not found" text={`There's no short link with the code “${code}”. Check the spelling — codes are not case-sensitive.`} />;
  if (phase.k === "deleted") return <Notice title="This link was deleted" text="Its owner removed it. The code stays reserved." />;
  if (phase.k === "blocked")
    return <Notice tone="bad" title="This link is blocked" text={`It was flagged as potentially harmful (${phase.type}). Its statistics are not available.`} />;
  if (phase.k === "error") return <Notice tone="bad" title="Couldn't load stats" text={phase.msg} retry={() => load()} />;
  if (phase.k === "notracking")
    return (
      <Notice
        title="This link has no statistics"
        text="It was created with privacy set to None, so clicks are not tracked and it can't be managed."
        extra={phase.preview.originalUrl ? <p className="mt-3 break-all text-sm">Destination: <span className="font-medium text-ink">{phase.preview.originalUrl}</span></p> : null}
      />
    );
  if (phase.k === "locked")
    return (
      <div className="mx-auto max-w-md py-16">
        <div className="card p-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand"><LockIcon /></span>
          <h1 className="mt-4 text-xl font-bold">Stats for /{phase.preview.shortCode} are protected</h1>
          <p className="mt-1 text-sm text-ink-2">
            {phase.need === "secret"
              ? "Enter the secret code you got when the link was created, or log in to the account that owns it."
              : "This link has a password. Enter it to see the statistics."}
          </p>
          <form
            className="mt-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!cred.trim()) return;
              setBusy(true);
              await load(phase.need === "secret" ? { secret: cred.trim() } : { password: cred });
              setBusy(false);
            }}
          >
            <label className="label" htmlFor="cred">{phase.need === "secret" ? "Secret code" : "Password"}</label>
            <input id="cred" className="input" type={phase.need === "secret" ? "text" : "password"} autoComplete="off" value={cred} onChange={(e) => setCred(e.target.value)} aria-invalid={Boolean(phase.error)} aria-describedby={phase.error ? "cred-err" : undefined} />
            {phase.error && <p id="cred-err" role="alert" className="mt-2 text-sm text-bad">{phase.error}</p>}
            <button className="btn-primary mt-4 w-full" disabled={busy || !cred.trim()}>{busy ? "Checking…" : "View stats"}</button>
          </form>
          {phase.need === "secret" && <p className="mt-4 text-center text-sm text-ink-3">Own this link? <Link href={`/login?next=/d/${encodeURIComponent(code)}`} className="font-medium text-brand">Log in</Link></p>}
        </div>
      </div>
    );

  return <Dashboard s={phase.stats} secret={phase.secret} isDemo={isDemo} reload={() => load({ secret: phase.secret })} />;
}

function Notice({ title, text, tone, retry, extra }: { title: string; text: string; tone?: "bad"; retry?: () => void; extra?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className={`text-2xl font-bold ${tone === "bad" ? "text-bad" : ""}`}>{title}</h1>
      <p className="mt-2 text-ink-2">{text}</p>
      {extra}
      <div className="mt-6 flex justify-center gap-2">
        {retry && <button className="btn-ghost" onClick={retry}>Try again</button>}
        <Link href="/" className="btn-primary">Shorten a link</Link>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

function Breakdown({ title, rows, total, map, empty = "No data yet" }: { title: string; rows: Counted[]; total: number; map?: (l: string) => string; empty?: string }) {
  return (
    <section className="card p-4" aria-label={title || undefined}>
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-3">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => {
            const pct = total ? Math.round((r.count / total) * 100) : 0;
            return (
              <li key={r.label}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{map ? map(r.label) : r.label}</span>
                  <span className="shrink-0 tabular-nums text-ink-3">{r.count.toLocaleString()} · {pct}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-surface-2"><div className="h-1.5 rounded bg-brand" style={{ width: `${pct}%` }} /></div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Chart({ data }: { data: Stats["stats"]["engagementsOverTime"] }) {
  const max = Math.max(1, ...data.map((d) => d.clicks));
  const [hover, setHover] = useState<number | null>(null);
  const h = hover !== null ? data[hover] : null;
  return (
    <section className="card p-4" aria-label="Clicks per day, last 30 days">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Clicks per day <span className="font-normal text-ink-3">· last 30 days</span></h3>
        <p className="text-xs text-ink-3" aria-live="polite">{h ? `${h.date}: ${h.clicks} clicks (${h.qrClicks} QR)` : "Hover a bar for details"}</p>
      </div>
      <div className="mt-4 flex h-44 items-end gap-[3px]" role="img" aria-label={`Peak ${max} clicks in a day`}>
        {data.map((d, i) => (
          <button
            key={d.date}
            type="button"
            className="group relative h-full flex-1 focus-visible:outline-offset-0"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            aria-label={`${d.date}: ${d.clicks} clicks`}
          >
            <span className="absolute inset-x-0 bottom-0 rounded-t bg-brand/25 group-hover:bg-brand/40" style={{ height: `${(d.clicks / max) * 100}%` }} />
            <span className="absolute inset-x-0 bottom-0 rounded-t bg-brand" style={{ height: `${((d.clicks - d.qrClicks) / max) * 100}%` }} />
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-3">
        <span>{data[0]?.date}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand" />Links</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand/30" />QR scans</span>
        </span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </section>
  );
}

function Dashboard({ s, secret, isDemo, reload }: { s: Stats; secret: string | null; isDemo: boolean; reload: () => void }) {
  const [qr, setQr] = useState(false);
  const [geoTab, setGeoTab] = useState<"countries" | "cities">("countries");
  const st = s.stats;
  const total = s.clicks;
  const canManage = s.controlMode === "full" && (s.isOwner || Boolean(secret));
  return (
    <div className="py-10">
      {isDemo && (
        <p className="mb-5 rounded-xl border border-warn/40 bg-warn-soft px-4 py-2.5 text-sm text-warn">
          Demo: these are generated sample clicks to show what a stats page looks like.
        </p>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Link statistics</p>
          <h1 className="mt-1 truncate text-2xl font-extrabold sm:text-3xl">{s.title || displayUrl(s.shortUrl)}</h1>
          <p className="mt-1 break-all text-sm text-ink-2">
            → <a href={s.originalUrl} target="_blank" rel="noreferrer noopener" className="hover:text-brand">{s.originalUrl}</a>
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip">{s.controlMode === "full" ? "Full" : "Stats only"}</span>
            {s.hasPassword && <span className="chip"><LockIcon width={12} height={12} />Password</span>}
            {s.state === "expired" && <span className="chip border-warn/40 text-warn">Expired ({s.expiredReason})</span>}
            {s.isOwner && <span className="chip border-ok/40 text-ok">Your link</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <CopyButton text={s.shortUrl} label="Copy link" className="btn-primary" />
          <a href={s.shortUrl} target="_blank" rel="noreferrer" className="btn-ghost"><ExternalIcon width={16} height={16} />Open</a>
          <button type="button" className="btn-ghost" onClick={() => setQr(true)}><QrIcon width={16} height={16} />QR code</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total clicks" value={total.toLocaleString()} hint={s.maxClicks ? `limit ${s.maxClicks.toLocaleString()}` : undefined} />
        <Kpi label="QR scans" value={s.qrClicks.toLocaleString()} hint={total ? `${Math.round((s.qrClicks / total) * 100)}% of clicks` : undefined} />
        <Kpi label="Best day" value={st.topPerformingDate ? st.topPerformingDate.clicks.toLocaleString() : "—"} hint={st.topPerformingDate?.date ?? "no clicks yet"} />
        <Kpi label="Expires" value={<span className="text-base">{s.expiresAt ? fmtDate(s.expiresAt) : s.maxClicks ? "By clicks" : "Never"}</span>} hint={`Created ${fmtDate(s.createdAt)}`} />
      </div>

      <div className="mt-4"><Chart data={st.engagementsOverTime} /></div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <section className="card p-4" aria-label="Locations">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Locations</h3>
            <div role="tablist" aria-label="Location level" className="flex rounded-lg bg-surface-2 p-0.5 text-xs">
              {(["countries", "cities"] as const).map((t) => (
                <button key={t} role="tab" aria-selected={geoTab === t} className={`rounded-md px-2 py-1 font-medium ${geoTab === t ? "bg-surface text-ink shadow-sm" : "text-ink-3"}`} onClick={() => setGeoTab(t)}>
                  {t === "countries" ? "Countries" : "Cities"}
                </button>
              ))}
            </div>
          </div>
          <div className="-mx-4 -mb-4">
            <Breakdown title="" rows={(geoTab === "countries" ? st.allCountries : st.allCities).slice(0, 8)} total={total} map={geoTab === "countries" ? regionName : undefined} />
          </div>
        </section>
        <Breakdown title="Devices" rows={st.deviceStats} total={total} />
        <Breakdown title="Browsers" rows={st.browserStats.slice(0, 6)} total={total} />
        <Breakdown title="Operating systems" rows={st.topPlatforms} total={total} />
        <Breakdown title="Referrers" rows={st.topReferrers} total={total} />
        <section className="card p-4" aria-label="Share">
          <h3 className="text-sm font-semibold">Share</h3>
          <div className="mt-3 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/links/${encodeURIComponent(s.shortCode)}/qr?format=png&size=256`} alt="" width={96} height={96} className="h-24 w-24 rounded-lg bg-white p-1" />
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold text-brand">{displayUrl(s.shortUrl)}</p>
              <button className="mt-2 text-sm font-medium text-ink-2 underline" onClick={() => setQr(true)}>Download QR</button>
            </div>
          </div>
        </section>
      </div>

      <section className="card mt-4 overflow-hidden" aria-label="Recent clicks">
        <h3 className="px-4 pt-4 text-sm font-semibold">Recent clicks</h3>
        {st.recentClicks.length === 0 ? (
          <p className="px-4 pb-4 pt-2 text-sm text-ink-3">No clicks yet. Share your link and they&apos;ll show up here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-2 w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-ink-3">
                <tr>{["Time", "Location", "Device", "Browser", "OS", "Source"].map((h) => <th key={h} scope="col" className="px-4 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {st.recentClicks.map((c, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="whitespace-nowrap px-4 py-2">{fmtDate(c.timestamp)}</td>
                    <td className="px-4 py-2">{c.city !== "Unknown" ? `${c.city}, ` : ""}{regionName(c.country)}</td>
                    <td className="px-4 py-2">{c.device}</td>
                    <td className="px-4 py-2">{c.browser}</td>
                    <td className="px-4 py-2">{c.os}</td>
                    <td className="px-4 py-2">{c.isQr ? <span className="chip">QR</span> : c.referrer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canManage && <ManageLink stats={s} secret={secret} onChanged={reload} />}
      {qr && <QrModal code={s.shortCode} shortUrl={s.shortUrl} onClose={() => setQr(false)} />}
      <p className="mt-6 text-xs text-ink-3">Totals update instantly; breakdowns come from the stored click log. Locations come from edge geo headers when available, otherwise from the browser language (estimate).</p>
    </div>
  );
}
