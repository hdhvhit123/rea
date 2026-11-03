import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomString(len: number, alphabet = ALPHABET): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function hashSecret(plain: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(plain, salt, 32);
  return ["scrypt", salt.toString("base64"), key.toString("base64")].join("$");
}

export function verifySecret(plain: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [scheme, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const key = Buffer.from(keyB64, "base64");
  const test = scryptSync(plain, Buffer.from(saltB64, "base64"), key.length);
  return timingSafeEqual(key, test);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
