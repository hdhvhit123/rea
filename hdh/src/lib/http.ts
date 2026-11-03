import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const v = await req.json();
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ApiError) {
    const res = NextResponse.json(e.toBody(), { status: e.status });
    const ra = e.extra.retryAfter;
    if (typeof ra === "number") res.headers.set("Retry-After", String(ra));
    return res;
  }
  console.error(e);
  return NextResponse.json({ error: "Something went wrong. Please try again later.", errorKey: "server.error" }, { status: 500 });
}

export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response> | Response) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      return errorResponse(e);
    }
  };
}
