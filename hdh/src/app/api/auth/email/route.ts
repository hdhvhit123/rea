import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { changeEmail, requireUser } from "@/lib/auth";

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  changeEmail(user, (await readJson(req)).email);
  return NextResponse.json({ success: true });
});
