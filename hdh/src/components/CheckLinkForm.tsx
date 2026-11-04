"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

export function parseShortInput(raw: string, host: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^[A-Za-z0-9._-]{1,64}$/.test(t)) return t;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (u.host !== host && !u.host.endsWith(host)) return null;
    const seg = u.pathname.replace(/^\/(d\/|go\/)?/, "").split("/")[0];
    return seg && /^[A-Za-z0-9._-]{1,64}$/.test(seg) ? seg : null;
  } catch {
    return null;
  }
}

export function CheckLinkForm() {
  const id = useId();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      noValidate
      className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        const code = parseShortInput(value, window.location.host);
        if (!code) {
          setError(`Enter a ${window.location.host} link or just its code.`);
          return;
        }
        setError(null);
        router.push(`/d/${encodeURIComponent(code)}`);
      }}
    >
      <div className="flex-1">
        <label htmlFor={`${id}-c`} className="sr-only">Short link or code</label>
        <input
          id={`${id}-c`}
          className="input h-11 font-mono text-sm"
          placeholder="hdh/abc123 or abc123"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-e` : undefined}
        />
        {error && <p id={`${id}-e`} role="alert" className="mt-1.5 text-sm text-bad">{error}</p>}
      </div>
      <button className="btn-dark h-11 px-5" type="submit">Check link</button>
    </form>
  );
}
