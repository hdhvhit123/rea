import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { listUserLinks, type DashboardFilter, type DashboardSort } from "@/lib/links";

const FILTERS = ["all", "active", "expired", "protected", "full", "statsOnly", "none"];
const SORTS = ["newest", "oldest", "clicks", "alias"];

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const q = new URL(req.url).searchParams;
  const filter = FILTERS.includes(q.get("filter") ?? "") ? (q.get("filter") as DashboardFilter) : "all";
  const sort = SORTS.includes(q.get("sort") ?? "") ? (q.get("sort") as DashboardSort) : "newest";
  const out = listUserLinks(user.id, {
    q: (q.get("q") ?? "").slice(0, 200),
    filter,
    sort,
    page: Number(q.get("page")) || 1,
    pageSize: Number(q.get("pageSize")) || 10,
  });
  return NextResponse.json(out, { headers: { "cache-control": "no-store" } });
});
