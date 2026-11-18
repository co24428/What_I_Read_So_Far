import "server-only";
import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(err: unknown, status = 500) {
  const message =
    err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : String(err);
  return NextResponse.json({ error: message }, { status });
}

const BOOK_FIELDS = [
  "isbn13", "title", "subtitle", "authors", "translators", "publisher", "published_date",
  "cover_url", "total_pages", "genre", "description", "source", "status", "started_at",
  "finished_at", "rating", "current_page",
] as const;

/** Keep only known book columns; convert "" → null. */
export function pickBook(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of BOOK_FIELDS) {
    if (f in body) {
      const v = body[f];
      out[f] = v === "" ? null : v;
    }
  }
  return out;
}

export function today(): string {
  // Asia/Seoul date — the reader is in Korea
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}
