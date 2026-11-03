import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireUser, signOutOtherSessions } from "@/lib/auth";

/** Sign out every other session of the current user. */
export const DELETE = handle(async () => {
  const user = await requireUser();
  return NextResponse.json({ success: true, signedOut: await signOutOtherSessions(user.id) });
});
