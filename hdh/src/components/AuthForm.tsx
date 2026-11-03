"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, ClientApiError, readRecent } from "@/lib/client";

export async function claimGuestLinks() {
  const links = readRecent()
    .filter((r) => r.secretCode)
    .map((r) => ({ code: r.code, secretCode: r.secretCode }));
  if (!links.length) return;
  try {
    await api("/api/dashboard/claim", { method: "POST", json: { links } });
  } catch {
    /* non-fatal */
  }
}

function safeNext(n: string | null): string {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export function AuthForm({ mode, providers }: { mode: "login" | "register"; providers: { google: boolean; github: boolean } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isReg = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) return setError("Enter your email and password.");
    if (isReg && password.length < 8) return setError("Passwords need at least 8 characters.");
    setBusy(true);
    try {
      await api(`/api/auth/${mode}`, { method: "POST", json: { email, password } });
      await claimGuestLinks();
      router.push(safeNext(sp.get("next")));
      router.refresh();
    } catch (e) {
      setError((e as ClientApiError).message);
      setBusy(false);
    }
  }

  const anyProvider = providers.google || providers.github;
  return (
    <div>
      {anyProvider && (
        <>
          {/* OAuth starts are API redirects, not pages, so plain anchors are intended. */}
          {/* eslint-disable @next/next/no-html-link-for-pages */}
          <div className="grid gap-2">
            {providers.google && <a href="/api/auth/oauth/google" className="btn-ghost w-full">Continue with Google</a>}
            {providers.github && <a href="/api/auth/oauth/github" className="btn-ghost w-full">Continue with GitHub</a>}
          </div>
          {/* eslint-enable @next/next/no-html-link-for-pages */}
          <div className="my-5 flex items-center gap-3 text-xs text-ink-3"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
        </>
      )}
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label className="label" htmlFor="password">{isReg ? "Password (at least 8 characters)" : "Password"}</label>
            {!isReg && <Link href="/forgot-password" className="text-xs font-medium text-brand">Forgot password?</Link>}
          </div>
          <input id="password" type="password" autoComplete={isReg ? "new-password" : "current-password"} className="input" value={password} onChange={(e) => setPassword(e.target.value)} minLength={isReg ? 8 : undefined} required />
        </div>
        {error && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
        <button className="btn-primary h-11" disabled={busy}>{busy ? (isReg ? "Creating account…" : "Logging in…") : isReg ? "Create account" : "Log in"}</button>
      </form>
      {isReg && (
        <p className="mt-4 text-xs text-ink-3">
          By signing up you agree to the <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      )}
      <p className="mt-6 text-center text-sm text-ink-2">
        {isReg ? "Already have an account? " : "New to hdh? "}
        <Link href={isReg ? "/login" : "/register"} className="font-semibold text-brand">{isReg ? "Log in" : "Create an account"}</Link>
      </p>
    </div>
  );
}
