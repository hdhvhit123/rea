"use client";

import { useState } from "react";
import { api, ClientApiError } from "@/lib/client";

export function AbuseForm() {
  const [link, setLink] = useState("");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  if (state === "done")
    return <p role="status" className="mt-8 rounded-xl bg-ok-soft p-4 text-ok">Thanks — your report was received and will be reviewed.</p>;
  return (
    <form
      noValidate
      className="not-prose mt-8 grid max-w-xl gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        setError(null);
        try {
          await api("/api/abuse", { method: "POST", json: { link, category, details, email } });
          setState("done");
        } catch (e) {
          setError((e as ClientApiError).message);
          setState("idle");
        }
      }}
    >
      <div>
        <label className="label" htmlFor="ab-link">Short link</label>
        <input id="ab-link" className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="e.g. my-launch or the full short URL" required />
      </div>
      <div>
        <label className="label" htmlFor="ab-cat">What&apos;s wrong?</label>
        <select id="ab-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Choose…</option>
          <option value="phishing">Phishing / fake login</option>
          <option value="malware">Malware or unwanted software</option>
          <option value="spam">Spam</option>
          <option value="other">Something else</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="ab-det">Details</label>
        <textarea id="ab-det" className="input h-28" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} required />
      </div>
      <div>
        <label className="label" htmlFor="ab-email">Your email <span className="font-normal text-ink-3">(optional, for follow-up)</span></label>
        <input id="ab-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <button className="btn-primary justify-self-start" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Send report"}</button>
    </form>
  );
}
