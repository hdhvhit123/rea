import { err } from "./errors";

/** In-process limiter. Good for one node; swap for Redis or similar when scaling out. */
type Store = { burst: Map<string, number[]>; daily: Map<string, { day: string; n: number }>; fails: Map<string, number[]> };
const g = globalThis as typeof globalThis & { __hdhRate?: Store };
const store: Store = (g.__hdhRate ??= { burst: new Map(), daily: new Map(), fails: new Map() });

const TEN_MIN = 10 * 60_000;
const FIFTEEN_MIN = 15 * 60_000;
const MAX_FAILS = 30;

const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);

function prune(list: number[], windowMs: number, now: number) {
  while (list.length && list[0] <= now - windowMs) list.shift();
}

export function clientIp(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

/** Counts every creation attempt (including failed validation) against the burst window. */
export function hitCreateBurst(ip: string, now = Date.now()) {
  const limit = num(process.env.HDH_RATE_BURST, 120);
  const list = store.burst.get(ip) ?? [];
  prune(list, TEN_MIN, now);
  if (list.length >= limit) {
    const retryAfter = Math.ceil((list[0] + TEN_MIN - now) / 1000);
    throw err(429, "rateLimit.tooManyRequests", "Too many requests. Please wait and try again.", { retryAfter });
  }
  list.push(now);
  store.burst.set(ip, list);
}

/** Counts successfully created links against the per-UTC-day cap. */
export function checkDailyCap(ip: string, accountAgeDays: number | null, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  const limit = accountAgeDays !== null && accountAgeDays >= 7 ? 2000 : num(process.env.HDH_RATE_DAILY, 300);
  const cur = store.daily.get(ip);
  const n = cur && cur.day === day ? cur.n : 0;
  if (n >= limit) {
    const midnight = Date.parse(`${day}T00:00:00Z`) + 86_400_000;
    throw err(429, "rateLimit.dailyLimit", "Daily link limit reached. Try again tomorrow.", {
      retryAfter: Math.ceil((midnight - now) / 1000),
    });
  }
  return () => store.daily.set(ip, { day, n: n + 1 });
}

export function assertNotLockedOut(ip: string, now = Date.now()) {
  const list = store.fails.get(ip) ?? [];
  prune(list, FIFTEEN_MIN, now);
  if (list.length >= MAX_FAILS) {
    const retryAfter = Math.ceil((list[0] + FIFTEEN_MIN - now) / 1000);
    throw err(429, "rateLimit.tooManyAttempts", "Too many wrong attempts. Please wait and try again.", { retryAfter });
  }
}

export function recordCredentialFailure(ip: string, now = Date.now()) {
  const list = store.fails.get(ip) ?? [];
  list.push(now);
  store.fails.set(ip, list);
}

export function resetRateLimitsForTests() {
  store.burst.clear();
  store.daily.clear();
  store.fails.clear();
}
