import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { changePassword, requireUser } from "@/lib/auth";

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const b = await readJson(req);
  changePassword(user, b.currentPassword, b.newPassword);
  return NextResponse.json({ success: true });
});
