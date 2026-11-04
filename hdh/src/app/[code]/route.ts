import { NextResponse } from "next/server";
import { decideRedirect, recordClick } from "@/lib/links";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const url = new URL(req.url);
  const isQr = url.searchParams.get("qr") === "1";
  const gate = new URL(`/go/${encodeURIComponent(code)}`, req.url);
  if (isQr) gate.searchParams.set("qr", "1");

  const d = decideRedirect(code);
  if (d.kind !== "redirect") return NextResponse.redirect(gate, 302);
  const counted = recordClick(code, req.headers, isQr);
  if (counted.kind !== "redirect") return NextResponse.redirect(gate, 302);
  const res = NextResponse.redirect(counted.url, 302);
  res.headers.set("cache-control", "private, no-store");
  res.headers.set("referrer-policy", "no-referrer-when-downgrade");
  return res;
}
