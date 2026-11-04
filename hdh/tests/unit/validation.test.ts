import { describe, expect, it } from "vitest";
import { normalizeUrl, resolveCreateExpiry, resolveUpdateExpiry, validateCustomCode, validateLinkPassword, validateControlMode } from "@/lib/validation";
import { ApiError } from "@/lib/errors";

const key = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as ApiError).errorKey;
  }
  return "ok";
};

describe("normalizeUrl", () => {
  it("adds https and keeps valid urls", () => {
    expect(normalizeUrl("example.com/x?y=1")).toBe("https://example.com/x?y=1");
    expect(normalizeUrl("http://sub.example.co.uk")).toBe("http://sub.example.co.uk/");
  });
  it("rejects bad input", () => {
    expect(key(() => normalizeUrl(""))).toBe("validation.originalUrlRequired");
    expect(key(() => normalizeUrl("ftp://example.com"))).toBe("validation.invalidUrl");
    expect(key(() => normalizeUrl("localhost:3000"))).toBe("validation.invalidUrl");
    expect(key(() => normalizeUrl("https://example.c0m"))).toBe("validation.invalidUrl");
    expect(key(() => normalizeUrl("https://user:pw@example.com"))).toBe("validation.invalidUrl");
    expect(key(() => normalizeUrl(`https://example.com/${"a".repeat(2050)}`))).toBe("validation.urlTooLong");
  });
  it("blocks self-shortening", () => {
    process.env.HDH_BASE_URL = "https://hdh.example";
    expect(key(() => normalizeUrl("hdh.example/abc"))).toBe("validation.selfShortenBlocked");
    delete process.env.HDH_BASE_URL;
  });
});

describe("validateCustomCode", () => {
  it.each([
    ["abcd", "customCodeErr.invalidLength"],
    ["a".repeat(65), "customCodeErr.invalidLength"],
    ["has space", "customCodeErr.invalidLength"],
    ["-abcde", "customCodeErr.startsWithSymbol"],
    ["abcde.", "customCodeErr.endsWithSymbol"],
    ["ab._cd", "customCodeErr.repeatedSymbols"],
    ["my-phishing", "customCodeErr.blockedKeyword"],
    ["login", "customCodeErr.codeTaken"],
    ["dashboard", "customCodeErr.codeTaken"],
    ["My.Launch_2026", "ok"],
  ])("%s -> %s", (input, expected) => {
    expect(key(() => validateCustomCode(input))).toBe(expected);
  });
});

describe("passwords and modes", () => {
  it("validates link passwords", () => {
    expect(key(() => validateLinkPassword("a b"))).toBe("validation.invalidPasswordChars");
    expect(key(() => validateLinkPassword("x".repeat(65)))).toBe("validation.invalidPasswordLength");
    expect(validateLinkPassword("ok-pass")).toBe("ok-pass");
  });
  it("validates control mode", () => {
    expect(validateControlMode(undefined)).toBe("full");
    expect(key(() => validateControlMode("public"))).toBe("validation.invalidControlMode");
  });
});

describe("expiry", () => {
  const now = Date.parse("2026-01-01T00:00:00Z");
  it("resolves time and click modes", () => {
    expect(resolveCreateExpiry({ expireMode: "hours", expireAfter: 2 }, now).expiresAt).toBe("2026-01-01T02:00:00.000Z");
    expect(resolveCreateExpiry({ expireMode: "clicks", expireAfter: 5 }, now)).toEqual({ expiresAt: null, maxClicks: 5 });
    expect(resolveCreateExpiry({ expireMode: "days" }, now).expiresAt).toBe("2026-01-02T00:00:00.000Z");
  });
  it("rejects invalid values", () => {
    expect(key(() => resolveCreateExpiry({ expireMode: "clicks", expireAfter: 0 }, now))).toBe("validation.invalidClickLimit");
    expect(key(() => resolveCreateExpiry({ expiresAt: "2020-01-01T00:00:00Z" }, now))).toBe("validation.expirationInPast");
    expect(key(() => resolveCreateExpiry({ expireMode: "days", expireAfter: 40000 }, now))).toBe("validation.expirationTooFar");
    expect(key(() => resolveCreateExpiry({ expireMode: "weeks" }, now))).toBe("validation.invalidExpiration");
  });
  it("update rules", () => {
    expect(resolveUpdateExpiry({ expireMode: "never" }, { expiresAt: null, clicks: 0 }, now)).toEqual({ expiresAt: null, maxClicks: null });
    expect(key(() => resolveUpdateExpiry({ expireMode: "clicks", expireAfter: 3 }, { expiresAt: null, clicks: 3 }, now))).toBe("validation.invalidClickLimit");
    expect(key(() => resolveUpdateExpiry({ expireMode: "minutes", expireAfter: 1 }, { expiresAt: "2026-01-01T05:00:00Z", clicks: 0 }, now))).toBe("validation.expirationInPast");
    expect(resolveUpdateExpiry({}, { expiresAt: null, clicks: 0 }, now)).toBeUndefined();
  });
});
