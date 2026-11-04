import { getDb } from "./db";

/**
 * The public demo stats page (/d/demo) uses generated sample clicks. They are
 * marked as demo data in the UI and are never mixed with real links.
 */
export const DEMO_CODE = "demo";

export function ensureDemo(): void {
  const db = getDb();
  const exists = db.prepare("SELECT id FROM links WHERE code = ?").get(DEMO_CODE) as { id: number } | undefined;
  if (exists) return;
  let seed = 20261103;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pick = <T,>(items: [T, number][]): T => {
    const total = items.reduce((s, [, w]) => s + w, 0);
    let r = rnd() * total;
    for (const [v, w] of items) if ((r -= w) <= 0) return v;
    return items[0][0];
  };
  const now = Date.now();
  const created = new Date(now - 32 * 86_400_000).toISOString();
  db.exec("BEGIN");
  try {
    const r = db
      .prepare(
        `INSERT INTO links (code, original_url, title, control_mode, created_at, updated_at, is_custom) VALUES (?, ?, ?, 'statsOnly', ?, ?, 1)`,
      )
      .run(DEMO_CODE, "https://example.com/spring-launch", "Spring launch (demo)", created, created);
    const linkId = Number(r.lastInsertRowid);
    const ins = db.prepare(
      "INSERT INTO clicks (link_id, ts, is_qr, country, city, device, browser, os, referrer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const geo: [[string, string], number][] = [
      [["VN", "Ho Chi Minh City"], 30], [["VN", "Hanoi"], 22], [["US", "New York"], 12], [["US", "San Francisco"], 6],
      [["JP", "Tokyo"], 9], [["SG", "Singapore"], 7], [["DE", "Berlin"], 5], [["GB", "London"], 5], [["FR", "Paris"], 4],
    ];
    let clicks = 0;
    let qr = 0;
    for (let d = 29; d >= 0; d--) {
      const n = Math.round(6 + (29 - d) * 0.8 + rnd() * 10);
      for (let i = 0; i < n; i++) {
        const isQr = rnd() < 0.18;
        const [country, city] = pick(geo);
        const device = pick<string>([["Mobile", 62], ["Desktop", 33], ["Tablet", 5]]);
        const os = device === "Desktop" ? pick<string>([["Windows", 55], ["macOS", 35], ["Linux", 10]]) : pick<string>([["Android", 55], ["iOS", 45]]);
        const browser = pick<string>([["Chrome", 58], ["Safari", 24], ["Edge", 8], ["Firefox", 6], ["Samsung Internet", 4]]);
        const referrer = isQr ? "QR code" : pick<string>([["Direct", 40], ["facebook.com", 22], ["t.co", 12], ["linkedin.com", 9], ["google.com", 10], ["zalo.me", 7]]);
        const ts = new Date(now - d * 86_400_000 - Math.floor(rnd() * 80_000_000)).toISOString();
        ins.run(linkId, ts, isQr ? 1 : 0, country, city, device, browser, os, referrer);
        clicks++;
        if (isQr) qr++;
      }
    }
    db.prepare("UPDATE links SET clicks = ?, qr_clicks = ? WHERE id = ?").run(clicks, qr, linkId);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
