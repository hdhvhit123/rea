import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { getStats } from "@/lib/links";
import { actorFrom } from "@/lib/actor";
import { DEMO_CODE, ensureDemo } from "@/lib/demo";

export const GET = handle(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const { code } = await ctx.params;
  if (code.toLowerCase() === DEMO_CODE) ensureDemo();
  const q = new URL(req.url).searchParams;
  const out = getStats(code, { secret: q.get("secret"), password: q.get("password"), mode: q.get("mode") }, await actorFrom(req));
  return NextResponse.json(out, { headers: { "cache-control": "no-store" } });
});
