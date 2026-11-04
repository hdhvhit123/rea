import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { restoreLink } from "@/lib/links";

export const POST = handle(async (_req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  const { code } = await ctx.params;
  return NextResponse.json(restoreLink(code, user.id));
});
