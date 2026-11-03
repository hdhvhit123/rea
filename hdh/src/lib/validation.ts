import { err } from "./errors";
import { baseHost } from "./config";

export const MAX_URL = 2048;
export const MAX_CLICKS = 100_000_000;
export const MAX_TITLE = 200;

export const RESERVED_CODES = new Set(
  [
    "api", "d", "u", "go", "docs", "guide", "login", "logout", "register", "signup", "forgot-password",
    "reset-password", "dashboard", "settings", "trash", "page", "terms", "privacy", "abuse", "admin",
    "static", "assets", "_next", "favicon.ico", "robots.txt", "sitemap.xml", "stats", "about", "help",
    "support", "account", "auth", "oauth", "check", "features", "pricing", "blog", "status",
  ].map((s) => s.toLowerCase()),
);

/** Words that may not appear inside a custom alias (impersonation / abuse bait). */
export const BLOCKED_KEYWORDS = ["phish", "malware", "login-verify", "account-verify", "paypa1", "hdh-support"];

export const CONTROL_MODES = ["full", "statsOnly", "none"] as const;
export type ControlMode = (typeof CONTROL_MODES)[number];

export const EXPIRE_MODES = ["minutes", "hours", "days", "clicks"] as const;
export type ExpireMode = (typeof EXPIRE_MODES)[number];

export function normalizeUrl(input: unknown): string {
  if (typeof input !== "string" || input.trim() === "")
    throw err(400, "validation.originalUrlRequired", "Enter the link you want to shorten.");
  let raw = input.trim();
  if (raw.length > MAX_URL) throw err(400, "validation.urlTooLong", "Links can be at most 2,048 characters.");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw err(400, "validation.invalidUrl", "That doesn't look like a valid web address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw err(400, "validation.invalidUrl", "Only http and https links can be shortened.");
  const host = url.hostname.toLowerCase();
  const tld = host.split(".").pop() ?? "";
  if (!host.includes(".") || !/^([a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(tld) || host.startsWith(".") || host.includes(".."))
    throw err(400, "validation.invalidUrl", "That doesn't look like a valid web address.");
  if (url.username || url.password)
    throw err(400, "validation.invalidUrl", "Links with embedded credentials are not allowed.");
  const own = baseHost().toLowerCase().split(":")[0];
  if (host === own || host.endsWith(`.${own}`))
    throw err(403, "validation.selfShortenBlocked", "Links that point to this shortener can't be shortened again.");
  const out = url.toString();
  if (out.length > MAX_URL) throw err(400, "validation.urlTooLong", "Links can be at most 2,048 characters.");
  return out;
}

export function validateCustomCode(input: unknown): string {
  if (typeof input !== "string") throw err(400, "customCodeErr.invalidLength", "Aliases must be 5–64 characters.");
  const code = input.trim();
  if (code.length < 5 || code.length > 64 || !/^[A-Za-z0-9._-]+$/.test(code))
    throw err(400, "customCodeErr.invalidLength", "Aliases must be 5–64 letters, digits, dots, underscores or hyphens.");
  if (/^[._-]/.test(code)) throw err(400, "customCodeErr.startsWithSymbol", "Aliases can't start with a symbol.");
  if (/[._-]$/.test(code)) throw err(400, "customCodeErr.endsWithSymbol", "Aliases can't end with a symbol.");
  if (/[._-]{2}/.test(code)) throw err(400, "customCodeErr.repeatedSymbols", "Aliases can't have two symbols in a row.");
  const lower = code.toLowerCase();
  const hit = BLOCKED_KEYWORDS.find((k) => lower.includes(k));
  if (hit) throw err(403, "customCodeErr.blockedKeyword", "This alias contains a word that isn't allowed.", { blockedKeyword: hit });
  if (RESERVED_CODES.has(lower)) throw err(409, "customCodeErr.codeTaken", "This alias is reserved. Try another one.");
  return code;
}

export function validateLinkPassword(input: unknown): string {
  if (typeof input !== "string" || input.length < 1 || input.length > 64)
    throw err(400, "validation.invalidPasswordLength", "Passwords must be 1–64 characters.");
  if (/\s/.test(input) || /[\u0000-\u001f\u007f]/.test(input))
    throw err(400, "validation.invalidPasswordChars", "Passwords can't contain spaces.");
  return input;
}

export function validateControlMode(input: unknown): ControlMode {
  if (input === undefined || input === null || input === "") return "full";
  if (typeof input === "string" && (CONTROL_MODES as readonly string[]).includes(input)) return input as ControlMode;
  throw err(400, "validation.invalidControlMode", "Choose Full, Stats only or None.");
}

export function validateTitle(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input !== "string") throw err(400, "validation.invalidTitle", "Title must be text.");
  const t = input.trim();
  if (t.length > MAX_TITLE) throw err(400, "validation.titleTooLong", "Titles can be at most 200 characters.");
  return t || null;
}

const UNIT_MS: Record<string, number> = { minutes: 60_000, hours: 3_600_000, days: 86_400_000 };
const HUNDRED_YEARS_MS = 100 * 365.25 * 86_400_000;

function positiveInt(v: unknown): number | null {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isInteger(n) && n > 0 ? n : null;
}

export interface ExpiryInput {
  expireMode?: unknown;
  expireAfter?: unknown;
  expiresAt?: unknown;
  maxClicks?: unknown;
}

/** Resolve creation-time expiry fields into an absolute time and/or click cap. */
export function resolveCreateExpiry(b: ExpiryInput, now = Date.now()): { expiresAt: string | null; maxClicks: number | null } {
  let expiresAt: string | null = null;
  let maxClicks: number | null = null;

  if (b.maxClicks !== undefined && b.maxClicks !== null && b.maxClicks !== "") {
    const n = positiveInt(b.maxClicks);
    if (n === null || n > MAX_CLICKS) throw err(400, "validation.invalidClickLimit", "Click limit must be 1–100,000,000.");
    maxClicks = n;
  }

  const mode = b.expireMode;
  if (mode !== undefined && mode !== null && mode !== "" && mode !== "never") {
    if (typeof mode !== "string" || !(EXPIRE_MODES as readonly string[]).includes(mode))
      throw err(400, "validation.invalidExpiration", "Unknown expiry unit.");
    const after = b.expireAfter === undefined || b.expireAfter === "" ? 1 : positiveInt(b.expireAfter);
    if (mode === "clicks") {
      if (after === null || after > MAX_CLICKS) throw err(400, "validation.invalidClickLimit", "Click limit must be 1–100,000,000.");
      maxClicks = after;
    } else {
      if (after === null) throw err(400, "validation.invalidExpiration", "Expiry must be a positive whole number.");
      const ms = after * UNIT_MS[mode];
      if (ms > HUNDRED_YEARS_MS) throw err(400, "validation.expirationTooFar", "Expiry can be at most 100 years away.");
      expiresAt = new Date(now + ms).toISOString();
    }
  }

  if (b.expiresAt !== undefined && b.expiresAt !== null && b.expiresAt !== "") {
    const t = typeof b.expiresAt === "string" ? Date.parse(b.expiresAt) : NaN;
    if (Number.isNaN(t)) throw err(400, "validation.invalidExpiration", "Expiry date is not valid.");
    if (t <= now) throw err(400, "validation.expirationInPast", "Expiry must be in the future.");
    if (t - now > HUNDRED_YEARS_MS) throw err(400, "validation.expirationTooFar", "Expiry can be at most 100 years away.");
    expiresAt = new Date(t).toISOString();
  }
  return { expiresAt, maxClicks };
}

export function resolveUpdateExpiry(
  b: { expireMode?: unknown; expireAfter?: unknown },
  current: { expiresAt: string | null; clicks: number },
  now = Date.now(),
): { expiresAt: string | null; maxClicks: number | null } | undefined {
  const mode = b.expireMode;
  if (mode === undefined) return undefined;
  if (mode === "never") return { expiresAt: null, maxClicks: null };
  if (typeof mode !== "string" || !(EXPIRE_MODES as readonly string[]).includes(mode))
    throw err(400, "validation.invalidExpireMode", "Choose never, minutes, hours, days or clicks.");
  const after = b.expireAfter === undefined || b.expireAfter === "" ? 1 : positiveInt(b.expireAfter);
  if (mode === "clicks") {
    if (after === null || after > MAX_CLICKS || after <= current.clicks)
      throw err(400, "validation.invalidClickLimit", "The click limit must be higher than the clicks so far.");
    return { expiresAt: null, maxClicks: after };
  }
  if (after === null) throw err(400, "validation.invalidExpiration", "Expiry must be a positive whole number.");
  const ms = after * UNIT_MS[mode];
  if (ms > HUNDRED_YEARS_MS) throw err(400, "validation.expirationTooFar", "Expiry can be at most 100 years away.");
  const next = now + ms;
  if (current.expiresAt && next <= Date.parse(current.expiresAt))
    throw err(400, "validation.expirationInPast", "The new expiry must end later than the current one.");
  return { expiresAt: new Date(next).toISOString(), maxClicks: null };
}
