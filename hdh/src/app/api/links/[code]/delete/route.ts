import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { deleteLink } from "@/lib/links";
import { actorFrom } from "@/lib/actor";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const { code } = await ctx.params;
  return NextResponse.json(deleteLink(code, await readJson(req), await actorFrom(req)));
});
