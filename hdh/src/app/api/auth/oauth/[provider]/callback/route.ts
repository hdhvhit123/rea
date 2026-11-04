import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handle } from "@/lib/http";
import { exchangeCode, isProvider } from "@/lib/oauth";
import { currentUser, setSessionCookie, upsertOAuthUser } from "@/lib/auth";
import { err } from "@/lib/errors";
import { safeEqual } from "@/lib/crypto";

export const GET = handle(async (req: Request, ctx: { params: Promise<{ provider: string }> }) => {
  const { provider } = await ctx.params;
  if (!isProvider(provider)) throw err(404, "notFound.route", "Unknown provider.");
  const q = new URL(req.url).searchParams;
  const jar = await cookies();
  const expected = jar.get("hdh_oauth_state")?.value ?? "";
  jar.delete("hdh_oauth_state");
  const state = q.get("state") ?? "";
  if (!expected || !safeEqual(expected, state)) throw err(400, "auth.oauthState", "Sign-in expired. Please try again.");
  const { providerId, email } = await exchangeCode(provider, q.get("code") ?? "");
  const me = await currentUser();
  const user = upsertOAuthUser(provider, providerId, email, me?.id ?? null);
  await setSessionCookie(user.id);
  return NextResponse.redirect(new URL(me ? "/dashboard/settings" : "/dashboard", req.url), 302);
});
