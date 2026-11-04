import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { registerUser, setSessionCookie } from "@/lib/auth";

export const POST = handle(async (req: Request) => {
  const b = await readJson(req);
  const user = registerUser(b.email, b.password);
  await setSessionCookie(user.id);
  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
});
