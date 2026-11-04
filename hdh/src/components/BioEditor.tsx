"use client";

import { useState } from "react";
import { api, ClientApiError } from "@/lib/client";
import type { BioPage } from "@/lib/bio";
import { BioView } from "./BioView";

const ACCENTS = ["#4f46e5", "#0f766e", "#c2410c", "#be185d", "#1d4ed8", "#15142a"];

export function BioEditor({ initial, base }: { initial: BioPage | null; base: string }) {
  const [handle, setHandle] = useState(initial?.handle ?? "");
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [theme, setTheme] = useState<"light" | "dark">(initial?.theme ?? "light");
  const [accent, setAccent] = useState(initial?.accent ?? ACCENTS[0]);
  const [links, setLinks] = useState(initial?.links ?? [{ title: "", url: "" }]);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [saved, setSaved] = useState<BioPage | null>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [step, setStep] = useState(initial ? 4 : 1);

  const setLink = (i: number, k: "title" | "url", v: string) => setLinks((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const move = (i: number, d: -1 | 1) =>
    setLinks((ls) => {
      const j = i + d;
      if (j < 0 || j >= ls.length) return ls;
      const c = [...ls];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ page: BioPage }>("/api/bio", { method: "PUT", json: { handle, displayName, bio, theme, accent, links: links.filter((l) => l.title || l.url), published } });
      setSaved(r.page);
      setMsg({ ok: true, text: published ? "Published." : "Saved as draft (not public)." });
    } catch (e) {
      setMsg({ ok: false, text: (e as ClientApiError).message });
    } finally {
      setBusy(false);
    }
  }

  const steps = ["Address", "Profile", "Links", "Design"];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <form onSubmit={save} className="grid content-start gap-4" noValidate>
        <div>
          <h1 className="text-2xl font-bold">Bio page</h1>
          <p className="mt-1 text-sm text-ink-2">One page that gathers all your links. Share its address on your social profiles.</p>
          {saved && saved.published && (
            <p className="mt-2 text-sm">Live at <a className="font-semibold text-brand" href={`/u/${saved.handle}`} target="_blank" rel="noreferrer">{base.replace(/^https?:\/\//, "")}/u/{saved.handle}</a></p>
          )}
        </div>
        <ol className="flex flex-wrap gap-2 text-xs" aria-label="Setup steps">
          {steps.map((s, i) => (
            <li key={s}>
              <button type="button" onClick={() => setStep(i + 1)} aria-current={step === i + 1 ? "step" : undefined} className={`chip ${step === i + 1 ? "border-brand bg-brand-soft text-brand" : ""}`}>{i + 1}. {s}</button>
            </li>
          ))}
        </ol>

        <section className="card grid gap-3 p-5" hidden={step !== 1 && step !== 4}>
          <h2 className="font-semibold">1. Choose your address</h2>
          <label htmlFor="bio-handle" className="label">Address</label>
          <div className="flex items-center overflow-hidden rounded-xl border border-line bg-surface focus-within:border-brand">
            <span className="shrink-0 pl-3 text-sm text-ink-3">/u/</span>
            <input id="bio-handle" className="w-full bg-transparent px-1 py-2.5 text-sm outline-none" value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} placeholder="your-name" maxLength={30} />
          </div>
          <p className="text-xs text-ink-3">3–30 lowercase letters, digits or single hyphens.</p>
        </section>

        <section className="card grid gap-3 p-5" hidden={step !== 2 && step !== 4}>
          <h2 className="font-semibold">2. Profile</h2>
          <div>
            <label htmlFor="bio-name" className="label">Display name</label>
            <input id="bio-name" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
          </div>
          <div>
            <label htmlFor="bio-text" className="label">Short bio <span className="font-normal text-ink-3">({bio.length}/300)</span></label>
            <textarea id="bio-text" className="input h-24" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
          </div>
        </section>

        <section className="card grid gap-3 p-5" hidden={step !== 3 && step !== 4}>
          <h2 className="font-semibold">3. Links</h2>
          {links.map((l, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_1.4fr_auto]">
              <input aria-label={`Link ${i + 1} title`} className="input" placeholder="Title" value={l.title} onChange={(e) => setLink(i, "title", e.target.value)} maxLength={80} />
              <input aria-label={`Link ${i + 1} URL`} className="input" placeholder="https://…" value={l.url} onChange={(e) => setLink(i, "url", e.target.value)} />
              <div className="flex gap-1">
                <button type="button" className="btn-ghost btn-sm" onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}>↑</button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => move(i, 1)} aria-label="Move down" disabled={i === links.length - 1}>↓</button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setLinks((ls) => ls.filter((_, j) => j !== i))} aria-label={`Remove link ${i + 1}`}>✕</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-ghost justify-self-start" onClick={() => setLinks((ls) => [...ls, { title: "", url: "" }])} disabled={links.length >= 30}>+ Add link</button>
        </section>

        <section className="card grid gap-3 p-5" hidden={step !== 4}>
          <h2 className="font-semibold">4. Design and publish</h2>
          <fieldset>
            <legend className="label">Theme</legend>
            <div className="flex gap-2">
              {(["light", "dark"] as const).map((t) => (
                <label key={t} className={`chip cursor-pointer ${theme === t ? "border-brand text-brand" : ""}`}>
                  <input type="radio" className="sr-only" name="theme" checked={theme === t} onChange={() => setTheme(t)} />
                  {t === "light" ? "Light" : "Dark"}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Accent colour</legend>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((c) => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" className="peer sr-only" name="accent" checked={accent === c} onChange={() => setAccent(c)} aria-label={c} />
                  <span className="block h-8 w-8 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-brand" style={{ background: c }} />
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-[var(--brand)]" />
            Public — anyone with the address can see it
          </label>
        </section>

        {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>{msg.text}</p>}
        <div className="flex flex-wrap gap-2">
          {step < 4 ? (
            <button type="button" className="btn-primary" onClick={() => setStep((s) => s + 1)}>Next</button>
          ) : (
            <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save page"}</button>
          )}
          {step > 1 && step < 4 && <button type="button" className="btn-ghost" onClick={() => setStep((s) => s - 1)}>Back</button>}
        </div>
      </form>

      <aside aria-label="Preview" className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Preview</p>
        <div className="h-[560px] overflow-auto rounded-[2rem] border-8 border-[#15142a] shadow-xl">
          <BioView page={{ handle, displayName, bio, theme, accent, links }} />
        </div>
      </aside>
    </div>
  );
}
