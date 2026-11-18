import { db } from "@/lib/supabase";
import { fail, ok, pickBook, today } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const [book, logs, reviews] = await Promise.all([
    db().from("books").select("*").eq("id", id).single(),
    db().from("progress_logs").select("*").eq("book_id", id).order("logged_on").order("created_at"),
    db().from("reviews").select("*").eq("book_id", id).order("created_at"),
  ]);
  if (book.error) return fail(book.error, 404);
  return ok({ book: book.data, logs: logs.data ?? [], reviews: reviews.data ?? [] });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = pickBook(await request.json());
  const { data: prev, error: e1 } = await db().from("books").select("*").eq("id", id).single();
  if (e1) return fail(e1, 404);

  // Fill dates automatically when the status moves forward
  if (body.status && body.status !== prev.status) {
    if (body.status === "reading" && !prev.started_at && !body.started_at) body.started_at = today();
    if (body.status === "done") {
      if (!prev.started_at && !body.started_at) body.started_at = today();
      if (!prev.finished_at && !body.finished_at) body.finished_at = today();
      const total = (body.total_pages as number | undefined) ?? prev.total_pages;
      if (total && body.current_page === undefined) body.current_page = total;
    }
  }
  body.updated_at = new Date().toISOString();
  const { data, error } = await db().from("books").update(body).eq("id", id).select().single();
  if (error) return fail(error);
  return ok(data);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { error } = await db().from("books").delete().eq("id", id);
  if (error) return fail(error);
  return ok({ ok: true });
}
