"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ClientApiError } from "@/lib/client";

function useAction() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ ok: true, text: await fn() });
    } catch (e) {
      setMsg({ ok: false, text: (e as ClientApiError).message });
    } finally {
      setBusy(false);
    }
  };
  const view = msg && <p role={msg.ok ? "status" : "alert"} className={`mt-2 text-sm ${msg.ok ? "text-ok" : "text-bad"}`}>{msg.text}</p>;
  return { busy, run, view };
}

export function SettingsPanel({ email, hasPassword, google, github, providers }: { email: string; hasPassword: boolean; google: boolean; github: boolean; providers: { google: boolean; github: boolean } }) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState(email);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const e1 = useAction();
  const e2 = useAction();
  const e3 = useAction();

  return (
    <div className="grid max-w-2xl gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <form className="card p-5" onSubmit={(e) => { e.preventDefault(); e1.run(async () => { await api("/api/auth/email", { method: "POST", json: { email: newEmail } }); router.refresh(); return "Email updated."; }); }}>
        <h2 className="font-semibold">Email</h2>
        <label htmlFor="set-email" className="label mt-3">Email address</label>
        <input id="set-email" type="email" className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        {e1.view}
        <button className="btn-primary mt-3" disabled={e1.busy || newEmail === email}>Save email</button>
      </form>

      <form className="card p-5" onSubmit={(e) => { e.preventDefault(); e2.run(async () => { await api("/api/auth/password", { method: "POST", json: { currentPassword: cur, newPassword: next } }); setCur(""); setNext(""); return "Password changed."; }); }}>
        <h2 className="font-semibold">{hasPassword ? "Change password" : "Set a password"}</h2>
        {hasPassword && (
          <>
            <label htmlFor="cur-pw" className="label mt-3">Current password</label>
            <input id="cur-pw" type="password" autoComplete="current-password" className="input" value={cur} onChange={(e) => setCur(e.target.value)} />
          </>
        )}
        <label htmlFor="new-pw" className="label mt-3">New password (at least 8 characters)</label>
        <input id="new-pw" type="password" autoComplete="new-password" className="input" value={next} onChange={(e) => setNext(e.target.value)} />
        {e2.view}
        <button className="btn-primary mt-3" disabled={e2.busy || next.length < 8}>Save password</button>
      </form>

      <section className="card p-5">
        <h2 className="font-semibold">Connected accounts</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(["google", "github"] as const).map((p) => {
            const linked = p === "google" ? google : github;
            const name = p === "google" ? "Google" : "GitHub";
            return (
              <li key={p} className="flex items-center justify-between gap-2">
                <span>{name}</span>
                {linked ? <span className="chip border-ok/40 text-ok">Connected</span> : providers[p] ? <a className="btn-ghost btn-sm" href={`/api/auth/oauth/${p}`}>Connect</a> : <span className="text-xs text-ink-3">Not configured on this server</span>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Sessions</h2>
        <p className="mt-1 text-sm text-ink-2">Sign out everywhere except this browser.</p>
        {e3.view}
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-ghost" disabled={e3.busy} onClick={() => e3.run(async () => { const r = await api<{ signedOut: number }>("/api/auth/sessions", { method: "DELETE" }); return `Signed out ${r.signedOut} other session(s).`; })}>Sign out other sessions</button>
          <button className="btn-danger" onClick={async () => { await api("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }}>Log out</button>
        </div>
      </section>
    </div>
  );
}
