"use client";

export class ClientApiError extends Error {
  constructor(public status: number, public errorKey: string, message: string, public body: Record<string, unknown> = {}) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...(rest.headers ?? {}) },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ClientApiError(0, "network", "Network error. Check your connection and try again.");
  }
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const retry = typeof body.retryAfter === "number" ? ` (retry in ${body.retryAfter}s)` : "";
    throw new ClientApiError(res.status, String(body.errorKey ?? "server.error"), `${String(body.error ?? "Something went wrong.")}${retry}`, body);
  }
  return body as T;
}

export interface RecentLink {
  code: string;
  shortUrl: string;
  originalUrl: string;
  secretCode: string | null;
  controlMode: string;
  createdAt: string;
}

const KEY = "hdh.recent";

export function readRecent(): RecentLink[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? (v as RecentLink[]) : [];
  } catch {
    return [];
  }
}

export function writeRecent(list: RecentLink[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
    window.dispatchEvent(new Event("hdh-recent"));
  } catch {
    /* storage unavailable */
  }
}

export function addRecent(l: RecentLink) {
  writeRecent([l, ...readRecent().filter((r) => r.code.toLowerCase() !== l.code.toLowerCase())]);
}

export function secretFor(code: string): string | null {
  return readRecent().find((r) => r.code.toLowerCase() === code.toLowerCase())?.secretCode ?? null;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function displayUrl(u: string): string {
  return u.replace(/^https?:\/\//, "");
}
