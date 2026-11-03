"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, ClientApiError } from "@/lib/client";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  if (state === "sent")
    return (
      <div role="status">
        <p className="font-semibold">Check your inbox</p>
        <p className="mt-1 text-sm text-ink-2">If an account exists for {email}, we sent a link to reset the password. It works for one hour.</p>
        <Link href="/login" className="btn-ghost mt-5 w-full">Back to log in</Link>
      </div>
    );
  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!email.trim()) return setError("Enter your email.");
        setState("busy");
        setError(null);
        try {
          await api("/api/auth/forgot", { method: "POST", json: { email } });
          setState("sent");
        } catch (e) {
          setError((e as ClientApiError).message);
          setState("idle");
        }
      }}
    >
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <button className="btn-primary h-11" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Send reset link"}</button>
      <p className="text-center text-sm"><Link href="/login" className="font-medium text-brand">Back to log in</Link></p>
    </form>
  );
}

export function ResetForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = sp.get("token") ?? "";
  if (!token) return <p role="alert" className="text-sm text-bad">This reset link is missing its token. Request a new one from <Link href="/forgot-password" className="underline">Reset password</Link>.</p>;
  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pw.length < 8) return setError("Passwords need at least 8 characters.");
        setBusy(true);
        setError(null);
        try {
          await api("/api/auth/reset", { method: "POST", json: { token, password: pw } });
          router.push("/dashboard");
          router.refresh();
        } catch (e) {
          setError((e as ClientApiError).message);
          setBusy(false);
        }
      }}
    >
      <div>
        <label className="label" htmlFor="pw">New password (at least 8 characters)</label>
        <input id="pw" type="password" autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <button className="btn-primary h-11" disabled={busy}>{busy ? "Saving…" : "Set new password"}</button>
    </form>
  );
}
