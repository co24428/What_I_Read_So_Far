import { db } from "@/lib/supabase";
import { fail, ok } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const { content } = (await request.json()) as { content?: string };
  if (!content?.trim()) return fail("content is required", 400);
  const { data, error } = await db()
    .from("reviews").update({ content: content.trim(), updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) return fail(error);
  return ok(data);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { error } = await db().from("reviews").delete().eq("id", id);
  if (error) return fail(error);
  return ok({ ok: true });
}
