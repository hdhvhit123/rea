import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { createLink } from "@/lib/links";
import { actorFrom } from "@/lib/actor";

/** Create via GET: always controlMode "none" (no secret, stats or management). */
export const GET = handle(async (req: Request) => {
  const q = new URL(req.url).searchParams;
  const actor = await actorFrom(req);
  const { status, body } = await createLink(
    { originalUrl: q.get("url") ?? "", customCode: q.get("custom") ?? undefined, controlMode: "none" },
    { ...actor, userId: null },
  );
  if (q.get("format") === "simple") return new NextResponse(body.shortUrl, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
  return NextResponse.json(body, { status });
});
