import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { createLink } from "@/lib/links";
import { actorFrom } from "@/lib/actor";

export const POST = handle(async (req: Request) => {
  const body = await readJson(req);
  const { status, body: out } = await createLink(body, await actorFrom(req));
  return NextResponse.json(out, { status });
});
