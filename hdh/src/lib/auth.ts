import { cookies } from "next/headers";
import { getDb, nowIso } from "./db";
import { err } from "./errors";
import { hashSecret, randomString, sha256, verifySecret } from "./crypto";

export const SESSION_COOKIE = "hdh_session";
const SESSION_DAYS = 30;

export interface User {
  id: number;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  github_id: string | null;
  created_at: string;
}

export function validateEmail(input: unknown): string {
  if (typeof input !== "string") throw err(400, "validation.invalidEmail", "Enter a valid email address.");
  const email = input.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw err(400, "validation.invalidEmail", "Enter a valid email address.");
  return email;
}

export function validateAccountPassword(input: unknown): string {
  if (typeof input !== "string" || input.length < 8) throw err(400, "validation.weakPassword", "Passwords need at least 8 characters.");
  if (input.length > 200) throw err(400, "validation.weakPassword", "Passwords can be at most 200 characters.");
  return input;
}

export function findUserByEmail(email: string): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
}

export function findUser(id: number): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function registerUser(emailIn: unknown, passwordIn: unknown): User {
  const email = validateEmail(emailIn);
  const password = validateAccountPassword(passwordIn);
  if (findUserByEmail(email)) throw err(409, "auth.emailTaken", "An account with this email already exists.");
  getDb().prepare("INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)").run(email, hashSecret(password), nowIso());
  return findUserByEmail(email)!;
}

export function authenticate(emailIn: unknown, passwordIn: unknown): User {
  const email = typeof emailIn === "string" ? emailIn.trim().toLowerCase() : "";
  const user = email ? findUserByEmail(email) : undefined;
  if (!user || typeof passwordIn !== "string" || !verifySecret(passwordIn, user.password_hash))
    throw err(401, "auth.invalidCredentials", "Email or password is incorrect.");
  return user;
}

export function createSession(userId: number): { token: string; expires: Date } {
  const token = randomString(40);
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  getDb().prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(sha256(token), userId, nowIso(), expires.toISOString());
  return { token, expires };
}

export function userFromToken(token: string | undefined | null): User | null {
  if (!token) return null;
  const row = getDb()
    .prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?")
    .get(sha256(token), nowIso()) as User | undefined;
  return row ?? null;
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  return userFromToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) throw err(401, "auth.loginRequired", "Please log in.");
  return u;
}

export async function setSessionCookie(userId: number) {
  const { token, expires } = createSession(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && (process.env.HDH_BASE_URL ?? "").startsWith("https://"),
    path: "/",
    expires,
  });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  jar.delete(SESSION_COOKIE);
}

export async function signOutOtherSessions(userId: number) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value ?? "";
  const r = getDb().prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?").run(userId, sha256(token));
  return Number(r.changes);
}

export function accountAgeDays(user: User | null): number | null {
  return user ? (Date.now() - Date.parse(user.created_at)) / 86_400_000 : null;
}

export function changePassword(user: User, current: unknown, next: unknown) {
  if (user.password_hash && (typeof current !== "string" || !verifySecret(current, user.password_hash)))
    throw err(401, "auth.invalidCredentials", "Current password is incorrect.");
  const pw = validateAccountPassword(next);
  getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashSecret(pw), user.id);
}

export function changeEmail(user: User, emailIn: unknown) {
  const email = validateEmail(emailIn);
  const other = findUserByEmail(email);
  if (other && other.id !== user.id) throw err(409, "auth.emailTaken", "An account with this email already exists.");
  getDb().prepare("UPDATE users SET email = ? WHERE id = ?").run(email, user.id);
}

export function createPasswordReset(emailIn: unknown): { token: string; user: User } | null {
  const email = typeof emailIn === "string" ? emailIn.trim().toLowerCase() : "";
  const user = email ? findUserByEmail(email) : undefined;
  if (!user) return null;
  const token = randomString(40);
  getDb()
    .prepare("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(sha256(token), user.id, new Date(Date.now() + 3_600_000).toISOString());
  return { token, user };
}

export function consumePasswordReset(token: unknown, password: unknown): User {
  if (typeof token !== "string" || !token) throw err(400, "auth.invalidResetToken", "This reset link is invalid or has expired.");
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > ?")
    .get(sha256(token), nowIso()) as { user_id: number; token_hash: string } | undefined;
  if (!row) throw err(400, "auth.invalidResetToken", "This reset link is invalid or has expired.");
  const pw = validateAccountPassword(password);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashSecret(pw), row.user_id);
  db.prepare("UPDATE password_resets SET used = 1 WHERE token_hash = ?").run(row.token_hash);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(row.user_id);
  return findUser(row.user_id)!;
}

/** Link or create a user from a verified OAuth identity. */
export function upsertOAuthUser(provider: "google" | "github", providerId: string, emailIn: string, currentUserId: number | null): User {
  const col = provider === "google" ? "google_id" : "github_id";
  const db = getDb();
  const byProvider = db.prepare(`SELECT * FROM users WHERE ${col} = ?`).get(providerId) as User | undefined;
  if (byProvider) return byProvider;
  if (currentUserId) {
    db.prepare(`UPDATE users SET ${col} = ? WHERE id = ?`).run(providerId, currentUserId);
    return findUser(currentUserId)!;
  }
  const email = validateEmail(emailIn);
  const byEmail = findUserByEmail(email);
  if (byEmail) {
    db.prepare(`UPDATE users SET ${col} = ? WHERE id = ?`).run(providerId, byEmail.id);
    return findUser(byEmail.id)!;
  }
  db.prepare(`INSERT INTO users (email, ${col}, created_at) VALUES (?, ?, ?)`).run(email, providerId, nowIso());
  return findUserByEmail(email)!;
}
