import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

/**
 * SQLite storage using Node's built-in driver (no native addon to compile).
 * Migrations are idempotent and run once per process on first use.
 */
const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    github_id TEXT UNIQUE,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE COLLATE NOCASE,
    original_url TEXT NOT NULL,
    title TEXT,
    control_mode TEXT NOT NULL DEFAULT 'full',
    secret_code TEXT,
    password_hash TEXT,
    expires_at TEXT,
    max_clicks INTEGER,
    clicks INTEGER NOT NULL DEFAULT 0,
    qr_clicks INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_custom INTEGER NOT NULL DEFAULT 0,
    blocked_type TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS links_user ON links(user_id)`,
  `CREATE INDEX IF NOT EXISTS links_url ON links(original_url)`,
  `CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    ts TEXT NOT NULL,
    is_qr INTEGER NOT NULL DEFAULT 0,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    device TEXT NOT NULL,
    browser TEXT NOT NULL,
    os TEXT NOT NULL,
    referrer TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS clicks_link_ts ON clicks(link_id, ts)`,
  `CREATE TABLE IF NOT EXISTS bio_pages (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    handle TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    theme TEXT NOT NULL DEFAULT 'light',
    accent TEXT NOT NULL DEFAULT '#4f46e5',
    links_json TEXT NOT NULL DEFAULT '[]',
    published INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS abuse_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link TEXT NOT NULL,
    category TEXT NOT NULL,
    details TEXT NOT NULL,
    email TEXT,
    created_at TEXT NOT NULL
  )`,
];

type GlobalWithDb = typeof globalThis & { __hdhDb?: DatabaseSync; __hdhDbPath?: string };

export function dbPath(): string {
  return process.env.HDH_DATABASE_PATH || path.join(process.cwd(), "data", "hdh.db");
}

export function getDb(): DatabaseSync {
  const g = globalThis as GlobalWithDb;
  const file = dbPath();
  if (g.__hdhDb && g.__hdhDbPath === file) return g.__hdhDb;
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  for (const sql of MIGRATIONS) db.exec(sql);
  g.__hdhDb = db;
  g.__hdhDbPath = file;
  return db;
}

/** Test helper: drop the cached connection so the next getDb() opens a fresh file. */
export function resetDbForTests(): void {
  const g = globalThis as GlobalWithDb;
  g.__hdhDb?.close();
  g.__hdhDb = undefined;
  g.__hdhDbPath = undefined;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    db.exec("COMMIT");
    return out;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
