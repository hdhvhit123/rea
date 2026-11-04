import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { previewLink } from "@/lib/links";

export const GET = handle(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const { code } = await ctx.params;
  const reveal = new URL(req.url).searchParams.get("reveal") === "1";
  return NextResponse.json(previewLink(code, reveal));
});
