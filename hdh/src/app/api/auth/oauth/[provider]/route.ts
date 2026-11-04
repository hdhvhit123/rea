import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handle } from "@/lib/http";
import { authorizeUrl, isProvider } from "@/lib/oauth";
import { randomString } from "@/lib/crypto";
import { err } from "@/lib/errors";

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ provider: string }> }) => {
  const { provider } = await ctx.params;
  if (!isProvider(provider)) throw err(404, "notFound.route", "Unknown provider.");
  const state = randomString(24);
  const url = authorizeUrl(provider, state);
  (await cookies()).set("hdh_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(url, 302);
});
