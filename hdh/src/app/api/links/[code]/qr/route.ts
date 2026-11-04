import QRCode from "qrcode";
import { handle } from "@/lib/http";
import { findLink } from "@/lib/links";
import { shortUrlFor } from "@/lib/config";
import { err } from "@/lib/errors";

/** QR codes encode the short URL with ?qr=1 so scans are counted separately from clicks. */
export const GET = handle(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const { code } = await ctx.params;
  const row = findLink(code);
  if (!row || row.deleted_at) throw err(404, "notFound.link", "No link with this short code.");
  const q = new URL(req.url).searchParams;
  const format = q.get("format") === "svg" ? "svg" : "png";
  const size = Math.min(Math.max(Number(q.get("size")) || 512, 128), 2048);
  const text = `${shortUrlFor(row.code)}?qr=1`;
  const download: Record<string, string> = q.get("download") === "1" ? { "content-disposition": `attachment; filename="hdh-${row.code}.${format}"` } : {};
  if (format === "svg") {
    const svg = await QRCode.toString(text, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
    return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600", ...download } });
  }
  const png = await QRCode.toBuffer(text, { type: "png", width: size, margin: 2, errorCorrectionLevel: "M" });
  return new Response(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "public, max-age=3600", ...download } });
});
