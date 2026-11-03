import { getDb, nowIso, tx } from "./db";
import { err } from "./errors";
import { hashSecret, randomString, safeEqual, verifySecret } from "./crypto";
import { shortUrlFor, statsUrlFor } from "./config";
import { checkDestination } from "./safety";
import { assertNotLockedOut, checkDailyCap, hitCreateBurst, recordCredentialFailure } from "./ratelimit";
import {
  normalizeUrl,
  resolveCreateExpiry,
  resolveUpdateExpiry,
  validateControlMode,
  validateCustomCode,
  validateLinkPassword,
  validateTitle,
  type ControlMode,
} from "./validation";
import { geoFromHeaders, parseUserAgent, referrerHost } from "./ua";

export interface LinkRow {
  id: number;
  code: string;
  original_url: string;
  title: string | null;
  control_mode: ControlMode;
  secret_code: string | null;
  password_hash: string | null;
  expires_at: string | null;
  max_clicks: number | null;
  clicks: number;
  qr_clicks: number;
  user_id: number | null;
  is_custom: number;
  blocked_type: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Actor {
  userId: number | null;
  ip: string;
  accountAgeDays?: number | null;
}

export const TRASH_DAYS = 30;

export type LinkState =
  | { state: "active" }
  | { state: "expired"; reason: "time" | "clicks" }
  | { state: "deleted" }
  | { state: "blocked"; blockedType: string };

export function linkState(row: LinkRow, now = Date.now()): LinkState {
  if (row.deleted_at) return { state: "deleted" };
  if (row.blocked_type) return { state: "blocked", blockedType: row.blocked_type };
  if (row.expires_at && Date.parse(row.expires_at) <= now) return { state: "expired", reason: "time" };
  if (row.max_clicks !== null && row.clicks >= row.max_clicks) return { state: "expired", reason: "clicks" };
  return { state: "active" };
}

export function findLink(code: string): LinkRow | undefined {
  return getDb().prepare("SELECT * FROM links WHERE code = ?").get(code) as LinkRow | undefined;
}

function requireLink(code: string): LinkRow {
  const row = findLink(code);
  if (!row) throw err(404, "notFound.link", "No link with this short code.");
  return row;
}

export function serializeCreated(row: LinkRow, opts: { secretCode: string | null; password: string | null }) {
  return {
    originalUrl: row.original_url,
    shortUrl: shortUrlFor(row.code),
    shortCode: row.code,
    statsUrl: statsUrlFor(row.code),
    clicks: row.clicks,
    expiresAt: row.expires_at,
    maxClicks: row.max_clicks,
    controlMode: row.control_mode,
    secretCode: opts.secretCode,
    password: opts.password,
    userId: row.user_id,
  };
}

export interface CreateInput {
  originalUrl?: unknown;
  customCode?: unknown;
  controlMode?: unknown;
  password?: unknown;
  expireMode?: unknown;
  expireAfter?: unknown;
  expiresAt?: unknown;
  maxClicks?: unknown;
  title?: unknown;
}

export async function createLink(input: CreateInput, actor: Actor): Promise<{ status: 200 | 201; body: ReturnType<typeof serializeCreated> }> {
  hitCreateBurst(actor.ip);
  const url = normalizeUrl(input.originalUrl);
  const customCode = input.customCode === undefined || input.customCode === null || input.customCode === "" ? null : validateCustomCode(input.customCode);
  const controlMode = validateControlMode(input.controlMode);
  const password = input.password === undefined || input.password === null || input.password === "" ? null : validateLinkPassword(input.password);
  const { expiresAt, maxClicks } = resolveCreateExpiry(input);
  const title = validateTitle(input.title);

  const verdict = await checkDestination(url);
  if (verdict.blocked) throw err(403, "validation.blacklistedDomain", "This destination is blocked because it may be unsafe.", { blockedType: verdict.type });

  const db = getDb();

  if (customCode) {
    const existing = findLink(customCode);
    if (existing) {
      if (existing.original_url === url && linkState(existing).state === "active" && existing.user_id === actor.userId)
        return { status: 200, body: serializeCreated(existing, { secretCode: null, password: null }) };
      throw err(409, "customCodeErr.codeTaken", "This alias is already taken. Try another one.");
    }
  } else if (!password && !expiresAt && maxClicks === null) {
    const dup = db
      .prepare(
        `SELECT * FROM links WHERE original_url = ? AND control_mode = ? AND password_hash IS NULL AND expires_at IS NULL
         AND max_clicks IS NULL AND is_custom = 0 AND deleted_at IS NULL AND blocked_type IS NULL AND user_id IS ?
         ORDER BY id DESC LIMIT 1`,
      )
      .get(url, controlMode, actor.userId) as LinkRow | undefined;
    if (dup) return { status: 200, body: serializeCreated(dup, { secretCode: null, password: null }) };
  }

  const commitDaily = checkDailyCap(actor.ip, actor.accountAgeDays ?? null);
  const secretCode = controlMode === "full" ? randomString(24) : null;
  const passwordHash = password ? hashSecret(password) : null;
  const now = nowIso();
  const insert = db.prepare(
    `INSERT INTO links (code, original_url, title, control_mode, secret_code, password_hash, expires_at, max_clicks, user_id, is_custom, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  let code = customCode;
  let row: LinkRow | undefined;
  for (let attempt = 0; attempt < 6 && !row; attempt++) {
    const candidate = code ?? randomString(attempt < 3 ? 6 : 7);
    try {
      insert.run(candidate, url, title, controlMode, secretCode, passwordHash, expiresAt, maxClicks, actor.userId, customCode ? 1 : 0, now, now);
      row = findLink(candidate);
    } catch (e) {
      if (!String(e).includes("UNIQUE")) throw e;
      if (customCode) throw err(409, "customCodeErr.codeTaken", "This alias is already taken. Try another one.");
      code = null;
    }
  }
  if (!row) throw err(500, "server.createFailed", "Couldn't generate a unique code. Please retry.");
  commitDaily();
  return { status: 201, body: serializeCreated(row, { secretCode, password }) };
}

/** Owner or secret holder may manage a full-mode link. */
function authorizeManage(row: LinkRow, secret: unknown, actor: Actor): { isOwner: boolean } {
  const isOwner = actor.userId !== null && row.user_id === actor.userId;
  if (isOwner) return { isOwner };
  if (row.control_mode !== "full") throw err(401, "auth.noPermission", "This link can't be managed.");
  if (secret === undefined || secret === null || secret === "") {
    if (row.user_id !== null) throw err(401, "auth.secretRequired", "Only the owner can manage this link.");
    throw err(401, "auth.invalidSecret", "Secret code is missing.");
  }
  assertNotLockedOut(actor.ip);
  if (typeof secret !== "string" || !row.secret_code || !safeEqual(secret, row.secret_code)) {
    recordCredentialFailure(actor.ip);
    throw err(401, "auth.invalidSecret", "That secret code is not correct.");
  }
  return { isOwner };
}

function checkLinkPassword(row: LinkRow, password: unknown, actor: Actor) {
  if (!row.password_hash) return;
  if (password === undefined || password === null || password === "") throw err(401, "auth.passwordRequired", "This link is password-protected.");
  assertNotLockedOut(actor.ip);
  if (typeof password !== "string" || !verifySecret(password, row.password_hash)) {
    recordCredentialFailure(actor.ip);
    throw err(401, "auth.invalidPassword", "Wrong password.");
  }
}

export function previewLink(code: string, reveal = false) {
  const row = requireLink(code);
  const st = linkState(row);
  const base = {
    shortCode: row.code,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    maxClicks: row.max_clicks,
    controlMode: row.control_mode,
    passwordProtected: Boolean(row.password_hash),
    blockedType: row.blocked_type,
  };
  if (st.state === "blocked") {
    throw err(403, "link.malicious", "This link was blocked because it may be harmful.", {
      blockedType: st.blockedType,
      ...(reveal ? { originalUrl: row.original_url } : {}),
    });
  }
  if (st.state === "deleted") throw err(410, "expired.deleted", "This link was deleted.");
  return {
    ...base,
    originalUrl: row.original_url,
    ...(st.state === "expired" ? { expired: true, reason: st.reason } : {}),
  };
}

export type RedirectDecision =
  | { kind: "redirect"; url: string }
  | { kind: "password" }
  | { kind: "expired"; reason: "time" | "clicks" | "deleted" }
  | { kind: "blocked"; blockedType: string }
  | { kind: "notfound" };

export function decideRedirect(code: string): RedirectDecision {
  const row = findLink(code);
  if (!row) return { kind: "notfound" };
  const st = linkState(row);
  if (st.state === "deleted") return { kind: "expired", reason: "deleted" };
  if (st.state === "blocked") return { kind: "blocked", blockedType: st.blockedType };
  if (st.state === "expired") return { kind: "expired", reason: st.reason };
  if (row.password_hash) return { kind: "password" };
  return { kind: "redirect", url: row.original_url };
}

/** Atomically re-checks limits and counts one visit. Returns the destination or the reason it can't be served. */
export function recordClick(code: string, headers: Headers, isQr: boolean): RedirectDecision {
  return tx(() => {
    const row = findLink(code);
    if (!row) return { kind: "notfound" } as const;
    const st = linkState(row);
    if (st.state === "deleted") return { kind: "expired", reason: "deleted" } as const;
    if (st.state === "blocked") return { kind: "blocked", blockedType: st.blockedType } as const;
    if (st.state === "expired") return { kind: "expired", reason: st.reason } as const;
    const db = getDb();
    db.prepare(`UPDATE links SET clicks = clicks + 1, qr_clicks = qr_clicks + ? WHERE id = ?`).run(isQr ? 1 : 0, row.id);
    if (row.control_mode !== "none") {
      const { device, browser, os } = parseUserAgent(headers.get("user-agent"));
      const { country, city } = geoFromHeaders(headers);
      db.prepare(
        `INSERT INTO clicks (link_id, ts, is_qr, country, city, device, browser, os, referrer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(row.id, nowIso(), isQr ? 1 : 0, country, city, device, browser, os, isQr ? "QR code" : referrerHost(headers));
    }
    return { kind: "redirect", url: row.original_url } as const;
  });
}

export function unlockAndClick(code: string, password: unknown, headers: Headers, actor: Actor, isQr: boolean): RedirectDecision {
  const row = requireLink(code);
  const st = linkState(row);
  if (st.state !== "active") return decideRedirect(code);
  checkLinkPassword(row, password, actor);
  return recordClick(code, headers, isQr);
}

type Counted = { label: string; count: number };

function countBy(linkId: number, column: "country" | "city" | "device" | "browser" | "os" | "referrer", limit?: number): Counted[] {
  const sql = `SELECT ${column} AS label, COUNT(*) AS count FROM clicks WHERE link_id = ? GROUP BY ${column} ORDER BY count DESC, label ASC${
    limit ? ` LIMIT ${limit}` : ""
  }`;
  return getDb().prepare(sql).all(linkId) as unknown as Counted[];
}

export function buildStats(row: LinkRow, now = Date.now()) {
  const db = getDb();
  const since = new Date(now - 29 * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);
  const perDay = db
    .prepare(
      `SELECT substr(ts, 1, 10) AS day, COUNT(*) AS clicks, SUM(is_qr) AS qr FROM clicks WHERE link_id = ? AND ts >= ? GROUP BY day`,
    )
    .all(row.id, since.toISOString()) as unknown as { day: string; clicks: number; qr: number }[];
  const map = new Map(perDay.map((d) => [d.day, d]));
  const engagementsOverTime = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(since.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    const d = map.get(day);
    return { date: day, clicks: d?.clicks ?? 0, qrClicks: d?.qr ?? 0 };
  });
  const top = engagementsOverTime.reduce<{ date: string; clicks: number } | null>(
    (best, d) => (d.clicks > 0 && (!best || d.clicks > best.clicks) ? { date: d.date, clicks: d.clicks } : best),
    null,
  );
  const recentClicks = db
    .prepare(`SELECT ts, is_qr, country, city, device, browser, os, referrer FROM clicks WHERE link_id = ? ORDER BY id DESC LIMIT 20`)
    .all(row.id) as unknown as { ts: string; is_qr: number; country: string; city: string; device: string; browser: string; os: string; referrer: string }[];
  return {
    engagementsOverTime,
    topPerformingDate: top,
    topCountries: countBy(row.id, "country", 5),
    topPlatforms: countBy(row.id, "os", 5),
    topReferrers: countBy(row.id, "referrer", 5),
    deviceStats: countBy(row.id, "device"),
    browserStats: countBy(row.id, "browser"),
    allCountries: countBy(row.id, "country"),
    allCities: countBy(row.id, "city"),
    recentClicks: recentClicks.map((c) => ({
      timestamp: c.ts,
      isQr: Boolean(c.is_qr),
      country: c.country,
      city: c.city,
      device: c.device,
      browser: c.browser,
      os: c.os,
      referrer: c.referrer,
    })),
  };
}

export function getStats(code: string, q: { secret?: string | null; password?: string | null; mode?: string | null }, actor: Actor) {
  const row = requireLink(code);
  const isOwner = actor.userId !== null && row.user_id === actor.userId;
  const st = linkState(row);

  if (q.mode === "redirect") {
    if (st.state === "deleted") throw err(410, "expired.deleted", "This link was deleted.");
    if (st.state === "blocked") throw err(403, "link.malicious", "This link was blocked.", { blockedType: st.blockedType });
    if (st.state === "expired") throw err(410, `expired.${st.reason}`, "This link has expired.");
    checkLinkPassword(row, q.password, actor);
    return { originalUrl: row.original_url };
  }

  let secretOk = false;
  if (!isOwner) {
    if (row.control_mode === "none") throw err(403, "forbidden.noTracking", "This link doesn't collect statistics.");
    if (row.control_mode === "full") {
      authorizeManage(row, q.secret, actor);
      secretOk = true;
    } else {
      checkLinkPassword(row, q.password, actor);
    }
    if (st.state === "deleted") throw err(410, "expired.deleted", "This link was deleted.");
    if (st.state === "expired" && !secretOk) throw err(410, `expired.${st.reason}`, "This link has expired.");
  }

  const createdMs = Date.parse(row.created_at);
  return {
    duration: Math.max(0, Math.round((Date.now() - createdMs) / 1000)),
    shortCode: row.code,
    originalUrl: row.original_url,
    title: row.title,
    shortUrl: shortUrlFor(row.code),
    clicks: row.clicks,
    qrClicks: row.qr_clicks,
    createdAt: row.created_at,
    lastAccessed: row.updated_at,
    expiresAt: row.expires_at,
    maxClicks: row.max_clicks,
    controlMode: row.control_mode,
    hasPassword: Boolean(row.password_hash),
    isOwner,
    state: st.state,
    ...(st.state === "expired" ? { expiredReason: st.reason } : {}),
    ...(isOwner && row.secret_code ? { secretCode: row.secret_code } : {}),
    stats: buildStats(row),
  };
}

export interface UpdateInput {
  secretCode?: unknown;
  originalUrl?: unknown;
  title?: unknown;
  password?: unknown;
  expireMode?: unknown;
  expireAfter?: unknown;
}

export async function updateLink(code: string, body: UpdateInput, actor: Actor) {
  const row = requireLink(code);
  if (row.control_mode !== "full") throw err(401, "auth.noPermission", "Only Full links can be edited.");
  authorizeManage(row, body.secretCode, actor);
  const st = linkState(row);
  if (st.state === "blocked") throw err(403, "link.malicious", "Blocked links can't be changed.", { blockedType: st.blockedType });
  if (st.state === "deleted") throw err(410, "expired.deleted", "This link was deleted.");

  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  if (body.originalUrl !== undefined) {
    const url = normalizeUrl(body.originalUrl);
    const verdict = await checkDestination(url);
    if (verdict.blocked) throw err(403, "validation.blacklistedDomain", "This destination is blocked because it may be unsafe.", { blockedType: verdict.type });
    sets.push("original_url = ?");
    vals.push(url);
  }
  if (body.title !== undefined) {
    sets.push("title = ?");
    vals.push(validateTitle(body.title));
  }
  if (body.password !== undefined) {
    sets.push("password_hash = ?");
    vals.push(body.password === null || body.password === "" ? null : hashSecret(validateLinkPassword(body.password)));
  }
  const exp = resolveUpdateExpiry(body, { expiresAt: row.expires_at, clicks: row.clicks });
  if (exp) {
    sets.push("expires_at = ?", "max_clicks = ?");
    vals.push(exp.expiresAt, exp.maxClicks);
  }
  if (sets.length) {
    sets.push("updated_at = ?");
    vals.push(nowIso(), row.id);
    getDb().prepare(`UPDATE links SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  }
  return { success: true };
}

export function deleteLink(code: string, body: { secretCode?: unknown }, actor: Actor) {
  const row = requireLink(code);
  if (row.deleted_at) throw err(410, "expired.deleted", "This link was already deleted.");
  authorizeManage(row, body.secretCode, actor);
  getDb().prepare("UPDATE links SET deleted_at = ?, updated_at = ? WHERE id = ?").run(nowIso(), nowIso(), row.id);
  return { success: true };
}

export function totalLinks(): number {
  const r = getDb().prepare("SELECT COUNT(*) AS n FROM links").get() as { n: number };
  return r.n;
}

// ---------- Account-owned link management ----------

export type DashboardSort = "newest" | "oldest" | "clicks" | "alias";
export type DashboardFilter = "all" | "active" | "expired" | "protected" | "full" | "statsOnly" | "none";

export function listUserLinks(userId: number, opts: { q?: string; filter?: DashboardFilter; sort?: DashboardSort; page?: number; pageSize?: number }) {
  const where = ["user_id = ?", "deleted_at IS NULL"];
  const args: (string | number)[] = [userId];
  if (opts.q) {
    where.push("(code LIKE ? OR original_url LIKE ? OR IFNULL(title, '') LIKE ?)");
    const like = `%${opts.q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    where[where.length - 1] = "(code LIKE ? ESCAPE '\\' OR original_url LIKE ? ESCAPE '\\' OR IFNULL(title, '') LIKE ? ESCAPE '\\')";
    args.push(like, like, like);
  }
  const nowS = nowIso();
  switch (opts.filter) {
    case "active":
      where.push("(expires_at IS NULL OR expires_at > ?) AND (max_clicks IS NULL OR clicks < max_clicks) AND blocked_type IS NULL");
      args.push(nowS);
      break;
    case "expired":
      where.push("((expires_at IS NOT NULL AND expires_at <= ?) OR (max_clicks IS NOT NULL AND clicks >= max_clicks))");
      args.push(nowS);
      break;
    case "protected":
      where.push("password_hash IS NOT NULL");
      break;
    case "full":
    case "statsOnly":
    case "none":
      where.push("control_mode = ?");
      args.push(opts.filter);
      break;
  }
  const order =
    opts.sort === "oldest" ? "id ASC" : opts.sort === "clicks" ? "clicks DESC, id DESC" : opts.sort === "alias" ? "code COLLATE NOCASE ASC" : "id DESC";
  const pageSize = Math.min(Math.max(opts.pageSize ?? 10, 1), 100);
  const page = Math.max(opts.page ?? 1, 1);
  const db = getDb();
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM links WHERE ${where.join(" AND ")}`).get(...args) as { n: number }).n;
  const rows = db
    .prepare(`SELECT * FROM links WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .all(...args, pageSize, (page - 1) * pageSize) as unknown as LinkRow[];
  return { total, page, pageSize, links: rows.map(dashboardView) };
}

export function dashboardView(row: LinkRow) {
  const st = linkState(row);
  return {
    shortCode: row.code,
    shortUrl: shortUrlFor(row.code),
    statsUrl: statsUrlFor(row.code),
    originalUrl: row.original_url,
    title: row.title,
    controlMode: row.control_mode,
    hasPassword: Boolean(row.password_hash),
    clicks: row.clicks,
    qrClicks: row.qr_clicks,
    expiresAt: row.expires_at,
    maxClicks: row.max_clicks,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    state: st.state,
  };
}

export function listTrash(userId: number) {
  const cutoff = new Date(Date.now() - TRASH_DAYS * 86_400_000).toISOString();
  const rows = getDb()
    .prepare("SELECT * FROM links WHERE user_id = ? AND deleted_at IS NOT NULL AND deleted_at > ? ORDER BY deleted_at DESC")
    .all(userId, cutoff) as unknown as LinkRow[];
  return rows.map((r) => ({
    ...dashboardView(r),
    purgeAt: new Date(Date.parse(r.deleted_at!) + TRASH_DAYS * 86_400_000).toISOString(),
  }));
}

export function restoreLink(code: string, userId: number) {
  const row = requireLink(code);
  if (row.user_id !== userId) throw err(401, "auth.noPermission", "This link isn't yours.");
  if (!row.deleted_at) return { success: true };
  if (Date.parse(row.deleted_at) + TRASH_DAYS * 86_400_000 < Date.now()) throw err(410, "expired.deleted", "This link was deleted more than 30 days ago.");
  getDb().prepare("UPDATE links SET deleted_at = NULL, updated_at = ? WHERE id = ?").run(nowIso(), row.id);
  return { success: true };
}

function parseCodeLike(s: string): string {
  const t = s.trim();
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://x.invalid/${t}`);
    return u.pathname.replace(/^\/(d\/)?/, "").split("/")[0];
  } catch {
    return t;
  }
}

export type ImportResult = { code: string; ok: boolean; reason?: string };

/** Claim full-mode guest links into an account using their secret codes. */
export function claimLinks(userId: number, items: { code: string; secretCode: string }[]): ImportResult[] {
  const db = getDb();
  return items.slice(0, 50).map(({ code: rawCode, secretCode }) => {
    const code = parseCodeLike(rawCode);
    const row = code ? findLink(code) : undefined;
    if (!row) return { code, ok: false, reason: "notFound" };
    if (row.user_id === userId) return { code, ok: true, reason: "alreadyYours" };
    if (row.user_id !== null) return { code, ok: false, reason: "ownedByAnother" };
    if (row.control_mode !== "full") return { code, ok: false, reason: "notFullMode" };
    if (row.deleted_at) return { code, ok: false, reason: "deleted" };
    if (!row.secret_code || !secretCode || !safeEqual(secretCode.trim(), row.secret_code)) return { code, ok: false, reason: "invalidSecret" };
    db.prepare("UPDATE links SET user_id = ?, updated_at = ? WHERE id = ?").run(userId, nowIso(), row.id);
    return { code, ok: true };
  });
}

export function parseImportText(text: string): { code: string; secretCode: string }[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [code, secretCode = ""] = l.split(/[\s,;]+/);
      return { code, secretCode };
    });
}

export function exportLinks(userId: number) {
  const rows = getDb().prepare("SELECT * FROM links WHERE user_id = ? AND deleted_at IS NULL ORDER BY id").all(userId) as unknown as LinkRow[];
  return rows.map((r) => ({
    shortCode: r.code,
    shortUrl: shortUrlFor(r.code),
    originalUrl: r.original_url,
    title: r.title ?? "",
    controlMode: r.control_mode,
    secretCode: r.secret_code ?? "",
    hasPassword: Boolean(r.password_hash),
    clicks: r.clicks,
    qrClicks: r.qr_clicks,
    expiresAt: r.expires_at ?? "",
    maxClicks: r.max_clicks ?? "",
    createdAt: r.created_at,
  }));
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "shortCode,shortUrl,originalUrl\n";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula injection guard
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n";
}
