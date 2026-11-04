import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { totalLinks } from "@/lib/links";

export const GET = handle(async () =>
  NextResponse.json({ total: totalLinks() }, { headers: { "cache-control": "public, max-age=60" } }),
);
