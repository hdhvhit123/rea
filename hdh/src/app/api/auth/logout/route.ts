import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { clearSession } from "@/lib/auth";

export const POST = handle(async () => {
  await clearSession();
  return NextResponse.json({ success: true });
});
