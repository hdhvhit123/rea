import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { currentUser } from "@/lib/auth";
import { oauthProviders } from "@/lib/config";

export const GET = handle(async () => {
  const u = await currentUser();
  return NextResponse.json(
    {
      user: u ? { id: u.id, email: u.email, createdAt: u.created_at, google: Boolean(u.google_id), github: Boolean(u.github_id), hasPassword: Boolean(u.password_hash) } : null,
      providers: oauthProviders(),
    },
    { headers: { "cache-control": "no-store" } },
  );
});
