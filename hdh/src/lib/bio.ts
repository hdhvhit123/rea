import { getDb, nowIso } from "./db";
import { err } from "./errors";
import { normalizeUrl, RESERVED_CODES } from "./validation";

export interface BioLink {
  title: string;
  url: string;
}

export interface BioPage {
  handle: string;
  displayName: string;
  bio: string;
  theme: "light" | "dark";
  accent: string;
  links: BioLink[];
  published: boolean;
  updatedAt: string;
}

interface BioRow {
  user_id: number;
  handle: string;
  display_name: string;
  bio: string;
  theme: string;
  accent: string;
  links_json: string;
  published: number;
  updated_at: string;
}

const toPage = (r: BioRow): BioPage => ({
  handle: r.handle,
  displayName: r.display_name,
  bio: r.bio,
  theme: r.theme === "dark" ? "dark" : "light",
  accent: r.accent,
  links: JSON.parse(r.links_json) as BioLink[],
  published: Boolean(r.published),
  updatedAt: r.updated_at,
});

export function getBioByUser(userId: number): BioPage | null {
  const r = getDb().prepare("SELECT * FROM bio_pages WHERE user_id = ?").get(userId) as BioRow | undefined;
  return r ? toPage(r) : null;
}

export function getBioByHandle(handle: string): BioPage | null {
  const r = getDb().prepare("SELECT * FROM bio_pages WHERE handle = ? AND published = 1").get(handle) as BioRow | undefined;
  return r ? toPage(r) : null;
}

export function saveBio(userId: number, input: Record<string, unknown>): BioPage {
  const handle = typeof input.handle === "string" ? input.handle.trim().toLowerCase() : "";
  if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(handle) || handle.includes("--"))
    throw err(400, "bio.invalidHandle", "Addresses are 3–30 lowercase letters, digits or single hyphens.");
  if (RESERVED_CODES.has(handle)) throw err(409, "bio.handleTaken", "This address is reserved.");
  const owner = getDb().prepare("SELECT user_id FROM bio_pages WHERE handle = ?").get(handle) as { user_id: number } | undefined;
  if (owner && owner.user_id !== userId) throw err(409, "bio.handleTaken", "This address is already taken.");

  const displayName = typeof input.displayName === "string" ? input.displayName.trim().slice(0, 60) : "";
  if (!displayName) throw err(400, "bio.nameRequired", "Add a display name.");
  const bio = typeof input.bio === "string" ? input.bio.trim().slice(0, 300) : "";
  const theme = input.theme === "dark" ? "dark" : "light";
  const accent = typeof input.accent === "string" && /^#[0-9a-f]{6}$/i.test(input.accent) ? input.accent : "#4f46e5";
  const rawLinks = Array.isArray(input.links) ? input.links : [];
  if (rawLinks.length > 30) throw err(400, "bio.tooManyLinks", "A page can have at most 30 links.");
  const links: BioLink[] = rawLinks.map((l, i) => {
    const o = (l ?? {}) as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title.trim().slice(0, 80) : "";
    if (!title) throw err(400, "bio.linkTitleRequired", `Link ${i + 1} needs a title.`);
    return { title, url: normalizeUrl(o.url) };
  });
  const published = input.published === false ? 0 : 1;

  getDb()
    .prepare(
      `INSERT INTO bio_pages (user_id, handle, display_name, bio, theme, accent, links_json, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET handle = excluded.handle, display_name = excluded.display_name, bio = excluded.bio,
         theme = excluded.theme, accent = excluded.accent, links_json = excluded.links_json, published = excluded.published,
         updated_at = excluded.updated_at`,
    )
    .run(userId, handle, displayName, bio, theme, accent, JSON.stringify(links), published, nowIso());
  return getBioByUser(userId)!;
}
