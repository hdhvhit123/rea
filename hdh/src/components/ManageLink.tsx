"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ClientApiError } from "@/lib/client";

interface Target {
  shortCode: string;
  originalUrl: string;
  title: string | null;
  hasPassword: boolean;
  clicks: number;
}

export function LinkEditForm({ link, secret, onSaved, onDeleted, onCancel }: { link: Target; secret: string | null; onSaved: () => void; onDeleted: () => void; onCancel?: () => void }) {
  const [url, setUrl] = useState(link.originalUrl);
  const [title, setTitle] = useState(link.title ?? "");
  const [pwMode, setPwMode] = useState<"keep" | "set" | "remove">("keep");
  const [pw, setPw] = useState("");
  const [expMode, setExpMode] = useState<"keep" | "never" | "minutes" | "hours" | "days" | "clicks">("keep");
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const enc = encodeURIComponent(link.shortCode);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const body: Record<string, unknown> = {};
    if (secret) body.secretCode = secret;
    if (url !== link.originalUrl) body.originalUrl = url;
    if (title !== (link.title ?? "")) body.title = title;
    if (pwMode === "set") body.password = pw;
    if (pwMode === "remove") body.password = null;
    if (expMode !== "keep") {
      body.expireMode = expMode;
      if (expMode !== "never") body.expireAfter = Number(amount);
    }
    try {
      await api(`/api/links/${enc}`, { method: "PATCH", json: body });
      setMsg({ ok: true, text: "Saved." });
      setPwMode("keep");
      setPw("");
      setExpMode("keep");
      onSaved();
    } catch (e) {
      setMsg({ ok: false, text: (e as ClientApiError).message });
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm(`Delete /${link.shortCode}? Visitors will see a "deleted" page. Links in an account can be restored from Trash for 30 days.`)) return;
    setBusy(true);
    try {
      await api(`/api/links/${enc}/delete`, { method: "POST", json: secret ? { secretCode: secret } : {} });
      onDeleted();
    } catch (e) {
      setMsg({ ok: false, text: (e as ClientApiError).message });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" aria-label={`Edit ${link.shortCode}`}>
      <div className="sm:col-span-2">
        <label className="label" htmlFor={`dest-${enc}`}>Destination</label>
        <input id={`dest-${enc}`} className="input" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={2048} required />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor={`title-${enc}`}>Title <span className="font-normal text-ink-3">(optional)</span></label>
        <input id={`title-${enc}`} className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      </div>
      <fieldset>
        <legend className="label">Password {link.hasPassword ? <span className="font-normal text-ink-3">(set)</span> : <span className="font-normal text-ink-3">(none)</span>}</legend>
        <select aria-label="Password action" className="input" value={pwMode} onChange={(e) => setPwMode(e.target.value as typeof pwMode)}>
          <option value="keep">Keep as is</option>
          <option value="set">{link.hasPassword ? "Change password" : "Add password"}</option>
          {link.hasPassword && <option value="remove">Remove password</option>}
        </select>
        {pwMode === "set" && <input aria-label="New link password" type="password" className="input mt-2" value={pw} onChange={(e) => setPw(e.target.value)} maxLength={64} autoComplete="new-password" />}
      </fieldset>
      <fieldset>
        <legend className="label">Expiry</legend>
        <div className="flex gap-2">
          <select aria-label="Expiry action" className="input" value={expMode} onChange={(e) => setExpMode(e.target.value as typeof expMode)}>
            <option value="keep">Keep as is</option>
            <option value="never">Never expire</option>
            <option value="minutes">In minutes</option>
            <option value="hours">In hours</option>
            <option value="days">In days</option>
            <option value="clicks">After clicks</option>
          </select>
          {!["keep", "never"].includes(expMode) && <input aria-label="Expiry amount" type="number" min={1} className="input w-24" value={amount} onChange={(e) => setAmount(e.target.value)} />}
        </div>
        {expMode === "clicks" && <p className="mt-1 text-xs text-ink-3">Must be above the current {link.clicks.toLocaleString()} clicks.</p>}
      </fieldset>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`sm:col-span-2 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>{msg.text}</p>}
      <div className="flex flex-wrap justify-between gap-2 sm:col-span-2">
        <button type="button" className="btn-danger" onClick={del} disabled={busy}>Delete link</button>
        <div className="flex gap-2">
          {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>}
          <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </form>
  );
}

export function ManageLink({ stats, secret, onChanged }: { stats: Target; secret: string | null; onChanged: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <section className="card mt-4 p-4" aria-labelledby="manage-title">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 id="manage-title" className="text-sm font-semibold">Manage link</h3>
          <p className="text-xs text-ink-3">Change destination, title, password or expiry, or delete it.</p>
        </div>
        <button className="btn-ghost btn-sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Edit"}</button>
      </div>
      {open && (
        <div className="mt-4 border-t border-line pt-4">
          <LinkEditForm link={stats} secret={secret} onSaved={onChanged} onDeleted={() => router.push("/?deleted=1")} onCancel={() => setOpen(false)} />
        </div>
      )}
    </section>
  );
}
