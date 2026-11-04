import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { consumePasswordReset, setSessionCookie } from "@/lib/auth";

export const POST = handle(async (req: Request) => {
  const b = await readJson(req);
  const user = consumePasswordReset(b.token, b.password);
  await setSessionCookie(user.id);
  return NextResponse.json({ success: true });
});
