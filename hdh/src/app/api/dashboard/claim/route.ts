import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { claimLinks } from "@/lib/links";

/** Called after sign-in with the device's "Recent links" so guest links join the account. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const b = await readJson(req);
  const items = Array.isArray(b.links)
    ? b.links
        .map((l) => (l ?? {}) as Record<string, unknown>)
        .filter((l) => typeof l.code === "string" && typeof l.secretCode === "string")
        .map((l) => ({ code: l.code as string, secretCode: l.secretCode as string }))
    : [];
  return NextResponse.json({ results: claimLinks(user.id, items) });
});
