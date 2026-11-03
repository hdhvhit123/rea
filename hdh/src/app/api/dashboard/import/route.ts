import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { claimLinks, parseImportText } from "@/lib/links";
import { err } from "@/lib/errors";

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const b = await readJson(req);
  const items = parseImportText(typeof b.text === "string" ? b.text : "");
  if (!items.length) throw err(400, "import.empty", "Add at least one line: short code and secret code.");
  if (items.length > 50) throw err(400, "import.tooMany", "Import at most 50 links at a time.");
  return NextResponse.json({ results: claimLinks(user.id, items) });
});
