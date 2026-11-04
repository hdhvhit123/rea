"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { addRecent, api, ClientApiError, displayUrl } from "@/lib/client";
import { ArrowIcon, ChartIcon, ChevronIcon, ClockIcon, ExternalIcon, LinkIcon, LockIcon, QrIcon, SlidersIcon, TagIcon } from "./icons";
import { CopyButton } from "./CopyButton";
import { QrModal } from "./QrModal";

interface Created {
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  statsUrl: string;
  controlMode: "full" | "statsOnly" | "none";
  secretCode: string | null;
  expiresAt: string | null;
  maxClicks: number | null;
}

type ExpireUnit = "never" | "minutes" | "hours" | "days" | "clicks";

export function ShortenForm({ compact = false, signedIn = false, onCreated }: { compact?: boolean; signedIn?: boolean; onCreated?: () => void }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [alias, setAlias] = useState("");
  const [unit, setUnit] = useState<ExpireUnit>("never");
  const [amount, setAmount] = useState("1");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"full" | "statsOnly" | "none">("full");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ msg: string; field?: string } | null>(null);
  const [result, setResult] = useState<Created | null>(null);
  const [reused, setReused] = useState(false);
  const [qr, setQr] = useState(false);

  useEffect(() => {
    if (compact) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compact]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!url.trim()) {
      setError({ msg: "Paste a link to shorten.", field: "url" });
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = { originalUrl: url, controlMode: mode };
      if (alias.trim()) body.customCode = alias.trim();
      if (password) body.password = password;
      if (unit !== "never") {
        body.expireMode = unit;
        body.expireAfter = Number(amount);
      }
      const out = await api<Created & { secretCode: string | null }>("/api/links", { method: "POST", json: body });
      const isReuse = out.secretCode === null && out.controlMode === "full";
      setReused(isReuse);
      setResult(out);
      addRecent({
        code: out.shortCode,
        shortUrl: out.shortUrl,
        originalUrl: out.originalUrl,
        secretCode: out.secretCode,
        controlMode: out.controlMode,
        createdAt: new Date().toISOString(),
      });
      onCreated?.();
    } catch (e) {
      const ce = e as ClientApiError;
      const field = ce.errorKey?.startsWith("customCodeErr") ? "alias" : ce.errorKey?.includes("Password") ? "password" : ce.errorKey?.includes("Expir") || ce.errorKey?.includes("ClickLimit") ? "expiry" : "url";
      if (field !== "url") setOpen(true);
      setError({ msg: ce.message, field });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setUrl("");
    setAlias("");
    setPassword("");
    setUnit("never");
    setAmount("1");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const errId = `${id}-err`;
  return (
    <>
    <div className={compact ? "" : "rounded-xl border border-line bg-surface p-2 shadow-lift"}>
      {!result ? (
        <form onSubmit={submit} noValidate aria-label="Shorten a link">
          <label htmlFor={`${id}-url`} className="sr-only">Long URL</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              {!compact && <LinkIcon width={20} height={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />}
              <input
                ref={inputRef}
                id={`${id}-url`}
                name="url"
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                placeholder={compact ? "Paste a long link, e.g. example.com/very/long/page" : "Paste a long link…"}
                className={compact ? "input h-12 pr-10 text-base" : "input h-14 rounded-lg border-brand-line pl-12 pr-11 text-base focus:border-brand sm:text-[17px]"}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-invalid={error?.field === "url"}
                aria-describedby={error ? errId : undefined}
                maxLength={2048}
              />
              {!compact && (
                <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-[5px] border border-line-strong bg-surface px-1.5 font-mono text-[11px] leading-[18px] text-ink-3 sm:block">/</kbd>
              )}
            </div>
            <button type="submit" className={compact ? "btn-primary h-12 px-6 text-base" : "btn-primary h-14 rounded-lg px-6 text-base sm:w-40"} disabled={busy}>
              {busy ? <span className="spinner" aria-hidden /> : null}
              {busy ? "Shortening…" : "Shorten"}
              {!busy && !compact && <ArrowIcon width={16} height={16} />}
            </button>
          </div>

          <div className={compact ? "" : "flex items-center justify-between gap-3 px-1 pt-1.5"}>
            <button
              type="button"
              className={compact ? "mt-3 inline-flex items-center gap-1 text-sm font-medium text-ink-2 hover:text-ink" : "btn-quiet h-9 gap-1.5 px-3 text-sm text-ink-3"}
              aria-expanded={open}
              aria-controls={`${id}-opts`}
              onClick={() => setOpen((v) => !v)}
            >
              {!compact && <SlidersIcon width={16} height={16} />}
              Options
              <ChevronIcon width={16} height={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {!compact && (
              <p aria-hidden className="hidden items-center gap-3 pr-2 text-[13px] text-ink-3 sm:flex">
                <span className="inline-flex items-center gap-1"><TagIcon width={14} height={14} />Custom alias</span>
                <span className="inline-flex items-center gap-1"><ClockIcon width={14} height={14} />Expires</span>
                <span className="inline-flex items-center gap-1"><LockIcon width={14} height={14} />Password</span>
              </p>
            )}
          </div>

          {open && (
            <div id={`${id}-opts`} className={`animate-pop grid gap-4 rounded-lg border border-line bg-surface-2 p-4 text-left sm:grid-cols-2 ${compact ? "mt-3" : "m-1 mt-2"}`}>
              <div>
                <label className="label" htmlFor={`${id}-alias`}>Custom alias</label>
                <div className="flex items-center overflow-hidden rounded-xl border border-line bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25">
                  <span className="shrink-0 pl-3 text-sm text-ink-3">{typeof window === "undefined" ? "" : window.location.host}/</span>
                  <input
                    id={`${id}-alias`}
                    className="w-full min-w-0 bg-transparent px-1 py-2.5 text-sm text-ink outline-none"
                    placeholder="my-launch"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    maxLength={64}
                    aria-invalid={error?.field === "alias"}
                    aria-describedby={`${id}-alias-hint`}
                  />
                </div>
                <p id={`${id}-alias-hint`} className="mt-1 text-xs text-ink-3">5–64 letters, digits, . _ - · first come, first served</p>
              </div>
              <div>
                <label className="label" htmlFor={`${id}-pw`}>Password</label>
                <input
                  id={`${id}-pw`}
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  placeholder="Optional"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={64}
                  aria-invalid={error?.field === "password"}
                />
                <p className="mt-1 text-xs text-ink-3">Visitors must enter it before they&apos;re redirected. No spaces.</p>
              </div>
              <fieldset>
                <legend className="label">Expires</legend>
                <div className="flex gap-2">
                  <input
                    aria-label="Expiry amount"
                    type="number"
                    min={1}
                    className="input w-28"
                    value={amount}
                    disabled={unit === "never"}
                    onChange={(e) => setAmount(e.target.value)}
                    aria-invalid={error?.field === "expiry"}
                  />
                  <select aria-label="Expiry unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value as ExpireUnit)}>
                    <option value="never">Never</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="clicks">Clicks</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-ink-3">After a time span or a number of clicks.</p>
              </fieldset>
              <fieldset>
                <legend className="label">Privacy</legend>
                <div className="grid gap-1.5">
                  {(
                    [
                      ["full", "Full", "Stats plus edit/delete with a secret code"],
                      ["statsOnly", "Stats only", "Anyone with the link can view stats"],
                      ["none", "None", "No tracking, no management"],
                    ] as const
                  ).map(([v, label, hint]) => (
                    <label key={v} className="flex cursor-pointer items-start gap-2 text-sm">
                      <input type="radio" name={`${id}-mode`} value={v} checked={mode === v} onChange={() => setMode(v)} className="mt-1 accent-[var(--brand)]" />
                      <span>
                        <span className="font-medium text-ink">{label}</span> <span className="text-ink-3">— {hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {error && (
            <p id={errId} role="alert" className={`rounded-md bg-bad-soft px-3 py-2 text-left text-sm text-bad ${compact ? "mt-3" : "m-1 mt-2"}`}>
              {error.msg}
            </p>
          )}
        </form>
      ) : (
        <div className={`animate-pop text-left ${compact ? "" : "p-3"}`} aria-live="polite">
          <p className="text-sm font-medium text-ok">{reused ? "You already shortened this link — here it is again." : "Your short link is ready"}</p>
          <div className="mt-2 flex flex-col gap-3 rounded-xl border border-line bg-surface-2 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <a href={result.shortUrl} target="_blank" rel="noreferrer" className="block truncate text-lg font-bold text-brand" data-testid="short-url">
                {displayUrl(result.shortUrl)}
              </a>
              <p className="truncate text-sm text-ink-3" title={result.originalUrl}>{result.originalUrl}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <CopyButton text={result.shortUrl} className="btn-primary btn-sm" />
              <a className="btn-ghost btn-sm" href={result.shortUrl} target="_blank" rel="noreferrer"><ExternalIcon width={14} height={14} />Open</a>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setQr(true)}><QrIcon width={14} height={14} />QR</button>
              {result.controlMode !== "none" && (
                <Link className="btn-ghost btn-sm" href={`/d/${result.shortCode}`}><ChartIcon width={14} height={14} />Stats</Link>
              )}
            </div>
          </div>
          {result.secretCode && !signedIn && (
            <div className="mt-3 rounded-xl border border-warn/40 bg-warn-soft p-3 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-warn"><LockIcon width={16} height={16} /> Save your secret code</p>
              <p className="mt-1 text-ink-2">It&apos;s shown only once and lets you view stats, edit or delete this link. It&apos;s also kept in Recent links on this device.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-lg border border-line bg-surface px-2 py-1 font-mono text-sm" data-testid="secret-code">{result.secretCode}</code>
                <CopyButton text={result.secretCode} label="Copy code" />
              </div>
            </div>
          )}
          {result.controlMode === "none" && <p className="mt-3 text-sm text-ink-3">This link has no stats or management (privacy: None).</p>}
          <button type="button" className="btn-ghost mt-4" onClick={reset}>Shorten another</button>
          {qr && <QrModal code={result.shortCode} shortUrl={result.shortUrl} onClose={() => setQr(false)} />}
        </div>
      )}
    </div>
    {!compact && (
      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
        <span>Press <kbd className="mx-0.5 rounded-[5px] border border-line-strong bg-surface px-1.5 font-mono text-[11px]">/</kbd> to start typing</span>
        {!signedIn && (
          <>
            <span aria-hidden className="h-3.5 w-px bg-line-strong" />
            <span>By shortening you agree to the <Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link></span>
          </>
        )}
      </p>
    )}
    </>
  );
}
