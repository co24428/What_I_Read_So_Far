import "server-only";
import type { BookCandidate } from "./types";

// KDC (Korean Decimal Classification) top-level classes → genre names
const KDC_GENRES: Record<string, string> = {
  "0": "총류",
  "1": "철학",
  "2": "종교",
  "3": "사회과학",
  "4": "자연과학",
  "5": "기술과학",
  "6": "예술",
  "7": "언어",
  "8": "문학",
  "9": "역사",
};

interface KakaoDoc {
  title: string;
  contents: string;
  isbn: string;
  datetime: string;
  authors: string[];
  translators: string[];
  publisher: string;
  thumbnail: string;
}

interface NlkDoc {
  TITLE?: string;
  AUTHOR?: string;
  PUBLISHER?: string;
  PAGE?: string;
  KDC?: string;
  SUBJECT?: string;
  PUBLISH_PREDATE?: string;
  EA_ISBN?: string;
  TITLE_URL?: string;
}

function isbn13Of(raw: string): string | null {
  const parts = raw.split(/\s+/).filter(Boolean);
  return parts.find((p) => p.length === 13) ?? parts[0] ?? null;
}

/** Kakao titles sometimes pack the subtitle in: "제목(부제)" or "제목: 부제". */
function splitTitle(title: string): { title: string; subtitle: string | null } {
  const colon = title.match(/^(.+?)\s*[:：]\s*(.+)$/);
  if (colon) return { title: colon[1].trim(), subtitle: colon[2].trim() };
  const paren = title.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (paren) return { title: paren[1].trim(), subtitle: paren[2].trim() };
  return { title: title.trim(), subtitle: null };
}

export async function searchKakao(query: string): Promise<BookCandidate[]> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("KAKAO_REST_API_KEY is not set");
  const digits = query.replace(/[-\s]/g, "");
  const target = /^\d{10}(\d{3})?$/.test(digits) ? "isbn" : "";
  const url = new URL("https://dapi.kakao.com/v3/search/book");
  url.searchParams.set("query", target ? digits : query);
  url.searchParams.set("size", "20");
  if (target) url.searchParams.set("target", target);

  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Kakao API error ${res.status}`);
  const data = (await res.json()) as { documents: KakaoDoc[] };

  return data.documents.map((d) => {
    const t = splitTitle(d.title);
    return {
      title: t.title,
      subtitle: t.subtitle,
      isbn13: isbn13Of(d.isbn),
      authors: d.authors ?? [],
      translators: d.translators ?? [],
      publisher: d.publisher || null,
      published_date: d.datetime ? d.datetime.slice(0, 10) : null,
      cover_url: d.thumbnail || null,
      description: d.contents || null,
      source: "kakao+nlk",
    };
  });
}

/** National Library of Korea (서지정보 ISBN API): page count, genre (KDC), subtitle. */
export async function lookupNlk(isbn: string): Promise<Partial<BookCandidate>> {
  const key = process.env.NLK_API_KEY;
  if (!key) return {};
  const url = new URL("https://www.nl.go.kr/seoji/SearchApi.do");
  url.searchParams.set("cert_key", key);
  url.searchParams.set("result_style", "json");
  url.searchParams.set("page_no", "1");
  url.searchParams.set("page_size", "1");
  url.searchParams.set("isbn", isbn);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return {};
    const data = (await res.json()) as { docs?: NlkDoc[] };
    const doc = data.docs?.[0];
    if (!doc) return {};
    const out: Partial<BookCandidate> = {};
    const pages = doc.PAGE?.match(/\d+/g);
    if (pages) out.total_pages = Math.max(...pages.map(Number));
    const kdc = (doc.KDC || doc.SUBJECT || "").trim();
    if (kdc && KDC_GENRES[kdc[0]]) out.genre = KDC_GENRES[kdc[0]];
    if (doc.TITLE) {
      const t = splitTitle(doc.TITLE);
      if (t.subtitle) out.subtitle = t.subtitle;
    }
    if (doc.TITLE_URL) out.cover_url = doc.TITLE_URL;
    return out;
  } catch {
    return {};
  }
}
