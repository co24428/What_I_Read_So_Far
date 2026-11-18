import { db } from "@/lib/supabase";
import { fail, ok, pickBook, today } from "@/lib/api";

export async function GET() {
  const { data, error } = await db().from("books").select("*").order("created_at", { ascending: false });
  if (error) return fail(error);
  return ok(data);
}

export async function POST(request: Request) {
  const body = pickBook(await request.json());
  if (!body.title) return fail("title is required", 400);
  if (body.status === "reading" && !body.started_at) body.started_at = today();
  if (body.status === "done") {
    body.started_at ??= today();
    body.finished_at ??= today();
    if (body.total_pages) body.current_page = body.total_pages;
  }
  const { data, error } = await db().from("books").insert(body).select().single();
  if (error) return fail(error);
  return ok(data, 201);
}
