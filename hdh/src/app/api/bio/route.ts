import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getBioByUser, saveBio } from "@/lib/bio";

export const GET = handle(async () => {
  const user = await requireUser();
  return NextResponse.json({ page: getBioByUser(user.id) }, { headers: { "cache-control": "no-store" } });
});

export const PUT = handle(async (req: Request) => {
  const user = await requireUser();
  return NextResponse.json({ page: saveBio(user.id, await readJson(req)) });
});
