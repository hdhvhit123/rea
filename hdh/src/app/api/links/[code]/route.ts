import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { updateLink } from "@/lib/links";
import { actorFrom } from "@/lib/actor";

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const { code } = await ctx.params;
  return NextResponse.json(await updateLink(code, await readJson(req), await actorFrom(req)));
});
