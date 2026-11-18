import { db } from "@/lib/supabase";
import { fail, ok } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const { content } = (await request.json()) as { content?: string };
  if (!content?.trim()) return fail("content is required", 400);
  const { data, error } = await db().from("reviews").insert({ book_id: id, content: content.trim() }).select().single();
  if (error) return fail(error);
  return ok(data, 201);
}
