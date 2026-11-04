import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { unlockAndClick } from "@/lib/links";
import { actorFrom } from "@/lib/actor";
import { ApiError } from "@/lib/errors";

/** Password gate form target: verifies the password, counts the click and redirects (303). */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const { code } = await ctx.params;
  const form = await req.formData();
  const isQr = form.get("qr") === "1";
  const back = new URL(`/go/${encodeURIComponent(code)}`, req.url);
  if (isQr) back.searchParams.set("qr", "1");
  try {
    const d = unlockAndClick(code, form.get("password"), req.headers, await actorFrom(req), isQr);
    if (d.kind === "redirect") return NextResponse.redirect(d.url, 303);
    return NextResponse.redirect(back, 303);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      back.searchParams.set("error", e.errorKey);
      return NextResponse.redirect(back, 303);
    }
    if (e instanceof ApiError && e.status === 429) {
      back.searchParams.set("error", e.errorKey);
      return NextResponse.redirect(back, 303);
    }
    throw e;
  }
});
