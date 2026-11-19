import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Postgres schema holding this app's tables (see supabase/schema.sql). */
const SCHEMA = process.env.SUPABASE_SCHEMA || "reading";

function make(url: string, key: string) {
  return createClient(url, key, { auth: { persistSession: false }, db: { schema: SCHEMA } });
}
let client: ReturnType<typeof make> | null = null;

/** Server-only Supabase client using the service-role key. Never import from client components. */
export function db() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  client = make(url, key);
  return client;
}
