import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { getDb, nowIso } from "@/lib/db";
import { err } from "@/lib/errors";
import { clientIp, hitCreateBurst } from "@/lib/ratelimit";

const CATEGORIES = ["phishing", "malware", "spam", "other"];

export const POST = handle(async (req: Request) => {
  hitCreateBurst(clientIp(req.headers));
  const b = await readJson(req);
  const link = typeof b.link === "string" ? b.link.trim().slice(0, 300) : "";
  const category = typeof b.category === "string" && CATEGORIES.includes(b.category) ? b.category : "";
  const details = typeof b.details === "string" ? b.details.trim().slice(0, 2000) : "";
  const email = typeof b.email === "string" && b.email.trim() ? b.email.trim().slice(0, 254) : null;
  if (!link) throw err(400, "abuse.linkRequired", "Enter the short link you're reporting.");
  if (!category) throw err(400, "abuse.categoryRequired", "Choose what's wrong with the link.");
  if (details.length < 10) throw err(400, "abuse.detailsRequired", "Tell us a bit more (at least 10 characters).");
  getDb().prepare("INSERT INTO abuse_reports (link, category, details, email, created_at) VALUES (?, ?, ?, ?, ?)").run(link, category, details, email, nowIso());
  return NextResponse.json({ success: true }, { status: 201 });
});
