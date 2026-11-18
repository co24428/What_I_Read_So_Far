import { db } from "@/lib/supabase";
import { fail, ok } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const k of ["nickname", "description", "color", "sort_order"]) if (k in body) patch[k] = body[k];
  const { data, error } = await db().from("trees").update(patch).eq("id", id).select().single();
  if (error) return fail(error);
  return ok(data);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const { error } = await db().from("trees").delete().eq("id", id);
  if (error) return fail(error);
  return ok({ ok: true });
}
