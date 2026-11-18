import { db } from "@/lib/supabase";
import { fail, ok, today } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Log "I'm on page X" — also moves the book to reading/done as needed. */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const { page, logged_on } = (await request.json()) as { page: number; logged_on?: string };
  if (!Number.isFinite(page) || page < 0) return fail("invalid page", 400);

  const { data: book, error: e1 } = await db().from("books").select("*").eq("id", id).single();
  if (e1) return fail(e1, 404);

  const date = logged_on || today();
  const { error: e2 } = await db().from("progress_logs").insert({ book_id: id, page, logged_on: date });
  if (e2) return fail(e2);

  const patch: Record<string, unknown> = { current_page: page, updated_at: new Date().toISOString() };
  if (book.status === "want" || book.status === "soon") {
    patch.status = "reading";
    if (!book.started_at) patch.started_at = date;
  }
  if (book.total_pages && page >= book.total_pages && book.status !== "done") {
    patch.status = "done";
    if (!book.finished_at) patch.finished_at = date;
    if (!book.started_at) patch.started_at = date;
  }
  const { data, error } = await db().from("books").update(patch).eq("id", id).select().single();
  if (error) return fail(error);
  return ok(data);
}

/** Delete a single log: DELETE ?log=<id> */
export async function DELETE(request: Request, { params }: Ctx) {
  const { id } = await params;
  const logId = new URL(request.url).searchParams.get("log");
  if (!logId) return fail("log is required", 400);
  const { error } = await db().from("progress_logs").delete().eq("id", logId).eq("book_id", id);
  if (error) return fail(error);
  const { data: last } = await db()
    .from("progress_logs").select("page").eq("book_id", id)
    .order("logged_on", { ascending: false }).order("created_at", { ascending: false }).limit(1);
  await db().from("books").update({ current_page: last?.[0]?.page ?? 0 }).eq("id", id);
  return ok({ ok: true });
}
