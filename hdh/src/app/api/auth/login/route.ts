import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { authenticate, setSessionCookie } from "@/lib/auth";
import { assertNotLockedOut, clientIp, recordCredentialFailure } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";

export const POST = handle(async (req: Request) => {
  const b = await readJson(req);
  const ip = clientIp(req.headers);
  assertNotLockedOut(ip);
  try {
    const user = authenticate(b.email, b.password);
    await setSessionCookie(user.id);
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) recordCredentialFailure(ip);
    throw e;
  }
});
