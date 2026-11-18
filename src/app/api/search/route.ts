import { fail, ok } from "@/lib/api";
import { lookupNlk, searchKakao } from "@/lib/bookApi";

/** GET /api/search?q=...  → Kakao results (cover, authors, publisher)
 *  GET /api/search?isbn=... → NLK details (page count, genre, subtitle) for one book */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const isbn = params.get("isbn");
    if (isbn) return ok(await lookupNlk(isbn));
    const q = params.get("q")?.trim();
    if (!q) return ok([]);
    return ok(await searchKakao(q));
  } catch (e) {
    return fail(e);
  }
}
