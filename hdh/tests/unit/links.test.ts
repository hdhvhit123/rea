import { beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resetDbForTests, getDb } from "@/lib/db";
import { resetRateLimitsForTests } from "@/lib/ratelimit";
import {
  claimLinks, createLink, decideRedirect, deleteLink, exportLinks, getStats, listTrash, listUserLinks, parseImportText,
  previewLink, recordClick, restoreLink, toCsv, unlockAndClick, updateLink,
} from "@/lib/links";
import { ApiError } from "@/lib/errors";
import { parseUserAgent, geoFromHeaders } from "@/lib/ua";

type FullStats = Extract<ReturnType<typeof getStats>, { stats: unknown }>;
const asFull = (s: ReturnType<typeof getStats>): FullStats => {
  if (!("stats" in s)) throw new Error("expected full stats");
  return s;
};

const guest = { userId: null, ip: "1.1.1.1" };
const hdrs = (h: Record<string, string> = {}) => new Headers({ "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Safari/604.1", ...h });

async function errKey(p: Promise<unknown> | (() => unknown)) {
  try {
    await (typeof p === "function" ? p() : p);
  } catch (e) {
    return (e as ApiError).errorKey;
  }
  return "ok";
}

function makeUser(email = "a@example.com"): number {
  const r = getDb().prepare("INSERT INTO users (email, password_hash, created_at) VALUES (?, 'x', ?)").run(email, new Date().toISOString());
  return Number(r.lastInsertRowid);
}

beforeEach(() => {
  resetDbForTests();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hdh-"));
  process.env.HDH_DATABASE_PATH = path.join(dir, "t.db");
  resetRateLimitsForTests();
});

describe("create", () => {
  it("creates full links with a secret and reuses identical ones", async () => {
    const a = await createLink({ originalUrl: "example.com" }, guest);
    expect(a.status).toBe(201);
    expect(a.body.secretCode).toMatch(/^[A-Za-z0-9]{24}$/);
    expect(a.body.shortCode).toHaveLength(6);
    const b = await createLink({ originalUrl: "https://example.com/" }, guest);
    expect(b.status).toBe(200);
    expect(b.body.shortCode).toBe(a.body.shortCode);
    expect(b.body.secretCode).toBeNull();
  });
  it("handles alias conflicts", async () => {
    await createLink({ originalUrl: "a.com", customCode: "Launch" }, guest);
    expect((await createLink({ originalUrl: "a.com", customCode: "launch" }, guest)).status).toBe(200);
    expect(await errKey(createLink({ originalUrl: "b.com", customCode: "LAUNCH" }, guest))).toBe("customCodeErr.codeTaken");
  });
  it("blocks blocklisted destinations", async () => {
    expect(await errKey(createLink({ originalUrl: "https://evil.example/x" }, guest))).toBe("validation.blacklistedDomain");
  });
  it("enforces the burst limit", async () => {
    process.env.HDH_RATE_BURST = "2";
    await createLink({ originalUrl: "a.com" }, guest);
    await errKey(createLink({ originalUrl: "" }, guest));
    expect(await errKey(createLink({ originalUrl: "b.com" }, guest))).toBe("rateLimit.tooManyRequests");
    delete process.env.HDH_RATE_BURST;
  });
});

describe("redirect and clicks", () => {
  it("counts clicks and expires by click limit", async () => {
    const { body } = await createLink({ originalUrl: "a.com", expireMode: "clicks", expireAfter: 2 }, guest);
    expect(recordClick(body.shortCode, hdrs(), false)).toEqual({ kind: "redirect", url: "https://a.com/" });
    expect(recordClick(body.shortCode, hdrs({ "cf-ipcountry": "VN" }), true).kind).toBe("redirect");
    expect(recordClick(body.shortCode, hdrs(), false)).toEqual({ kind: "expired", reason: "clicks" });
    const s = asFull(getStats(body.shortCode, { secret: body.secretCode }, guest));
    expect(s.clicks).toBe(2);
    expect(s.qrClicks).toBe(1);
    expect(s.state).toBe("expired");
    expect(s.stats.deviceStats).toEqual([{ label: "Mobile", count: 2 }]);
    expect(s.stats.topReferrers.map((r) => r.label).sort()).toEqual(["Direct", "QR code"]);
    expect(s.stats.engagementsOverTime).toHaveLength(30);
  });
  it("gates password links", async () => {
    const { body } = await createLink({ originalUrl: "a.com", password: "pw1" }, guest);
    expect(decideRedirect(body.shortCode).kind).toBe("password");
    expect(await errKey(() => unlockAndClick(body.shortCode, "nope", hdrs(), guest, false))).toBe("auth.invalidPassword");
    expect(unlockAndClick(body.shortCode, "pw1", hdrs(), guest, false).kind).toBe("redirect");
  });
  it("does not store click details for mode none", async () => {
    const { body } = await createLink({ originalUrl: "a.com", controlMode: "none" }, guest);
    recordClick(body.shortCode, hdrs(), false);
    expect((getDb().prepare("SELECT COUNT(*) n FROM clicks").get() as { n: number }).n).toBe(0);
    expect(await errKey(() => getStats(body.shortCode, {}, guest))).toBe("forbidden.noTracking");
  });
});

describe("stats access", () => {
  it("requires secret for full and password for protected statsOnly", async () => {
    const full = (await createLink({ originalUrl: "a.com" }, guest)).body;
    expect(await errKey(() => getStats(full.shortCode, {}, guest))).toBe("auth.invalidSecret");
    expect(await errKey(() => getStats(full.shortCode, { secret: "wrong" }, guest))).toBe("auth.invalidSecret");
    const so = (await createLink({ originalUrl: "b.com", controlMode: "statsOnly", password: "pp" }, guest)).body;
    expect(await errKey(() => getStats(so.shortCode, {}, guest))).toBe("auth.passwordRequired");
    expect(asFull(getStats(so.shortCode, { password: "pp" }, guest)).shortCode).toBe(so.shortCode);
    expect(getStats(so.shortCode, { password: "pp", mode: "redirect" }, guest)).toEqual({ originalUrl: "https://b.com/" });
  });
  it("locks out after too many wrong secrets", async () => {
    const full = (await createLink({ originalUrl: "a.com" }, guest)).body;
    for (let i = 0; i < 30; i++) await errKey(() => getStats(full.shortCode, { secret: "bad" }, guest));
    expect(await errKey(() => getStats(full.shortCode, { secret: full.secretCode }, guest))).toBe("rateLimit.tooManyAttempts");
  });
});

describe("update, delete, trash, claim", () => {
  it("updates with secret and enforces rules", async () => {
    const l = (await createLink({ originalUrl: "a.com", expireMode: "days", expireAfter: 1 }, guest)).body;
    await updateLink(l.shortCode, { secretCode: l.secretCode, originalUrl: "b.com", title: " Hi ", password: "new" }, guest);
    let p = previewLink(l.shortCode);
    expect(p.originalUrl).toBe("https://b.com/");
    expect(p.passwordProtected).toBe(true);
    expect(await errKey(updateLink(l.shortCode, { secretCode: l.secretCode, expireMode: "minutes", expireAfter: 5 }, guest))).toBe("validation.expirationInPast");
    await updateLink(l.shortCode, { secretCode: l.secretCode, expireMode: "clicks", expireAfter: 10, password: null }, guest);
    p = previewLink(l.shortCode);
    expect(p.expiresAt).toBeNull();
    expect(p.maxClicks).toBe(10);
    expect(p.passwordProtected).toBe(false);
    const so = (await createLink({ originalUrl: "c.com", controlMode: "statsOnly" }, guest)).body;
    expect(await errKey(updateLink(so.shortCode, { title: "x" }, guest))).toBe("auth.noPermission");
  });
  it("soft-deletes, keeps the code reserved and restores for owners", async () => {
    const uid = makeUser();
    const owner = { userId: uid, ip: "2.2.2.2" };
    const l = (await createLink({ originalUrl: "a.com", customCode: "keep-me" }, owner)).body;
    deleteLink(l.shortCode, {}, owner);
    expect(decideRedirect("keep-me")).toEqual({ kind: "expired", reason: "deleted" });
    expect(await errKey(createLink({ originalUrl: "z.com", customCode: "keep-me" }, guest))).toBe("customCodeErr.codeTaken");
    expect(listTrash(uid)).toHaveLength(1);
    expect(listUserLinks(uid, {}).total).toBe(0);
    restoreLink("keep-me", uid);
    expect(decideRedirect("keep-me").kind).toBe("redirect");
    expect(await errKey(() => deleteLink("keep-me", {}, guest))).toBe("auth.secretRequired");
  });
  it("claims guest links with secret and exports csv", async () => {
    const uid = makeUser();
    const g = (await createLink({ originalUrl: "a.com" }, guest)).body;
    const res = claimLinks(uid, parseImportText(`${g.shortUrl} ${g.secretCode}\nnope-code xyz`));
    expect(res[0]).toEqual({ code: g.shortCode, ok: true });
    expect(res[1].reason).toBe("notFound");
    const other = makeUser("b@example.com");
    expect(claimLinks(other, [{ code: g.shortCode, secretCode: g.secretCode! }])[0].reason).toBe("ownedByAnother");
    const rows = exportLinks(uid);
    expect(rows[0].secretCode).toBe(g.secretCode);
    expect(toCsv([{ a: "=SUM(1)", b: 'x,"y"' }])).toBe("a,b\n'=SUM(1),\"x,\"\"y\"\"\"\n");
  });
  it("lists with search, filter, sort and paging", async () => {
    const uid = makeUser();
    const o = { userId: uid, ip: "3.3.3.3" };
    await createLink({ originalUrl: "alpha.com", customCode: "alpha1" }, o);
    await createLink({ originalUrl: "beta.com", customCode: "beta12", password: "x" }, o);
    await createLink({ originalUrl: "gamma.com", customCode: "gamma1", controlMode: "statsOnly" }, o);
    recordClick("gamma1", hdrs(), false);
    expect(listUserLinks(uid, { q: "beta" }).links.map((l) => l.shortCode)).toEqual(["beta12"]);
    expect(listUserLinks(uid, { filter: "protected" }).total).toBe(1);
    expect(listUserLinks(uid, { filter: "statsOnly" }).links[0].shortCode).toBe("gamma1");
    expect(listUserLinks(uid, { sort: "clicks" }).links[0].shortCode).toBe("gamma1");
    expect(listUserLinks(uid, { sort: "alias", pageSize: 2, page: 2 }).links.map((l) => l.shortCode)).toEqual(["gamma1"]);
  });
});

describe("ua and geo", () => {
  it("parses common agents", () => {
    expect(parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36 Edg/120")).toEqual({ device: "Desktop", browser: "Edge", os: "Windows" });
    expect(parseUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile Safari/537.36").os).toBe("Android");
    expect(parseUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) Safari/604.1").device).toBe("Tablet");
  });
  it("prefers edge headers and falls back to language", () => {
    expect(geoFromHeaders(new Headers({ "cf-ipcountry": "jp" }))).toEqual({ country: "JP", city: "Unknown" });
    expect(geoFromHeaders(new Headers({ "accept-language": "vi-VN,vi;q=0.9" })).country).toBe("VN");
    expect(geoFromHeaders(new Headers()).country).toBe("Unknown");
  });
});
