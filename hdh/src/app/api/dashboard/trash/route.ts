import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { listTrash } from "@/lib/links";

export const GET = handle(async () => {
  const user = await requireUser();
  return NextResponse.json({ links: listTrash(user.id) }, { headers: { "cache-control": "no-store" } });
});
