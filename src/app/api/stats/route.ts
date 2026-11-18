import { db } from "@/lib/supabase";
import { fail, ok } from "@/lib/api";
import type { Book, ProgressLog } from "@/lib/types";

type Bucket = { pages: number; finished: number; started: number };
const empty = (): Bucket => ({ pages: 0, finished: 0, started: 0 });

function topCounts(values: string[], limit = 10) {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }));
}

/** GET /api/stats?year=2026 */
export async function GET(request: Request) {
  const yearParam = new URL(request.url).searchParams.get("year");
  const [b, l] = await Promise.all([
    db().from("books").select("*"),
    db().from("progress_logs").select("*").order("logged_on").order("created_at"),
  ]);
  if (b.error) return fail(b.error);
  if (l.error) return fail(l.error);
  const books = b.data as Book[];
  const logs = l.data as ProgressLog[];

  // Pages read per day, from the differences between consecutive logs of each book
  const pagesByMonth = new Map<string, number>(); // "YYYY-MM" → pages
  const add = (date: string, pages: number) => {
    const k = date.slice(0, 7);
    pagesByMonth.set(k, (pagesByMonth.get(k) ?? 0) + pages);
  };
  const logsByBook = new Map<string, ProgressLog[]>();
  for (const log of logs) {
    const arr = logsByBook.get(log.book_id) ?? [];
    arr.push(log);
    logsByBook.set(log.book_id, arr);
  }
  for (const book of books) {
    const bl = logsByBook.get(book.id);
    if (bl?.length) {
      let prev = 0;
      for (const log of bl) {
        if (log.page > prev) add(log.logged_on, log.page - prev);
        prev = Math.max(prev, log.page);
      }
    } else if (book.status === "done" && book.finished_at && book.total_pages) {
      add(book.finished_at, book.total_pages); // finished without logs → count all pages on finish date
    }
  }

  const years = new Set<number>();
  for (const k of pagesByMonth.keys()) years.add(Number(k.slice(0, 4)));
  for (const bk of books) {
    if (bk.finished_at) years.add(Number(bk.finished_at.slice(0, 4)));
    if (bk.started_at) years.add(Number(bk.started_at.slice(0, 4)));
  }
  const currentYear = Number(new Date().getFullYear());
  years.add(currentYear);
  const year = yearParam ? Number(yearParam) : currentYear;

  const yearly = new Map<number, Bucket>();
  const monthly: Bucket[] = Array.from({ length: 12 }, empty);
  for (const y of years) yearly.set(y, empty());
  for (const [k, pages] of pagesByMonth) {
    const y = Number(k.slice(0, 4));
    yearly.get(y)!.pages += pages;
    if (y === year) monthly[Number(k.slice(5, 7)) - 1].pages += pages;
  }
  for (const bk of books) {
    if (bk.status === "done" && bk.finished_at) {
      const y = Number(bk.finished_at.slice(0, 4));
      yearly.get(y)!.finished++;
      if (y === year) monthly[Number(bk.finished_at.slice(5, 7)) - 1].finished++;
    }
    if (bk.started_at) {
      const y = Number(bk.started_at.slice(0, 4));
      yearly.get(y)!.started++;
      if (y === year) monthly[Number(bk.started_at.slice(5, 7)) - 1].started++;
    }
  }

  const finishedThisYear = books.filter((bk) => bk.status === "done" && bk.finished_at?.startsWith(String(year)));
  const rated = finishedThisYear.filter((bk) => bk.rating != null);

  return ok({
    year,
    years: [...years].sort((a, b2) => b2 - a),
    monthly: monthly.map((m, i) => ({ month: i + 1, ...m })),
    yearly: [...yearly.entries()].sort((a, b2) => a[0] - b2[0]).map(([y, v]) => ({ year: y, ...v })),
    genres: topCounts(finishedThisYear.map((bk) => bk.genre || "-")),
    authors: topCounts(finishedThisYear.flatMap((bk) => bk.authors)),
    publishers: topCounts(finishedThisYear.map((bk) => bk.publisher || "-")),
    totals: {
      pages: monthly.reduce((s, m) => s + m.pages, 0),
      finished: finishedThisYear.length,
      avgRating: rated.length ? rated.reduce((s, bk) => s + Number(bk.rating), 0) / rated.length : null,
      library: books.length,
      byStatus: {
        want: books.filter((bk) => bk.status === "want").length,
        soon: books.filter((bk) => bk.status === "soon").length,
        reading: books.filter((bk) => bk.status === "reading").length,
        done: books.filter((bk) => bk.status === "done").length,
      },
    },
  });
}
