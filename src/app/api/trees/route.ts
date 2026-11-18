import { db } from "@/lib/supabase";
import { fail, ok } from "@/lib/api";

export async function GET() {
  const { data, error } = await db().from("trees").select("*").order("sort_order").order("created_at");
  if (error) return fail(error);
  return ok(data);
}

export async function POST(request: Request) {
  const { nickname, description, color } = (await request.json()) as Record<string, string>;
  if (!nickname?.trim()) return fail("nickname is required", 400);
  const { data: last } = await db().from("trees").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const { data, error } = await db()
    .from("trees")
    .insert({ nickname: nickname.trim(), description: description || null, color: color || "#6366f1", sort_order: (last?.[0]?.sort_order ?? -1) + 1 })
    .select().single();
  if (error) return fail(error);
  return ok(data, 201);
}

/** Reorder: body = [{ id, sort_order }] */
export async function PATCH(request: Request) {
  const items = (await request.json()) as { id: string; sort_order: number }[];
  const results = await Promise.all(items.map((it) => db().from("trees").update({ sort_order: it.sort_order }).eq("id", it.id)));
  const err = results.find((r) => r.error)?.error;
  if (err) return fail(err);
  return ok({ ok: true });
}
