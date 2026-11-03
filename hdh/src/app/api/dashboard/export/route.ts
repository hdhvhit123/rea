import { handle } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { exportLinks, toCsv } from "@/lib/links";

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const format = new URL(req.url).searchParams.get("format") === "json" ? "json" : "csv";
  const rows = exportLinks(user.id);
  const stamp = new Date().toISOString().slice(0, 10);
  const body = format === "json" ? JSON.stringify(rows, null, 2) : toCsv(rows);
  return new Response(body, {
    headers: {
      "content-type": format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="hdh-links-${stamp}.${format}"`,
      "cache-control": "no-store",
    },
  });
});
