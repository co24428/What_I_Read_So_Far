"use client";
import { useMemo, useState } from "react";
import type { Book, BookStatus } from "@/lib/types";
import { STATUSES, STATUS_COLORS } from "@/lib/types";
import { fmtDate, percent } from "@/lib/client";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Button, Cover, ProgressBar, StarRating, StatusBadge, inputCls } from "@/components/ui";

type SortKey = "title" | "authors" | "genre" | "publisher" | "started_at" | "finished_at" | "rating" | "total_pages" | "status" | "created_at";

const COLUMNS: { key: SortKey; label: DictKey; className?: string }[] = [
  { key: "title", label: "title" },
  { key: "authors", label: "authors" },
  { key: "publisher", label: "publisher", className: "hidden md:table-cell" },
  { key: "genre", label: "genre", className: "hidden md:table-cell" },
  { key: "status", label: "status" },
  { key: "started_at", label: "startedAt", className: "hidden sm:table-cell" },
  { key: "finished_at", label: "finishedAt", className: "hidden sm:table-cell" },
  { key: "total_pages", label: "pages", className: "hidden lg:table-cell" },
  { key: "rating", label: "rating", className: "hidden lg:table-cell" },
];

function sortValue(b: Book, k: SortKey): string | number | null {
  switch (k) {
    case "authors": return b.authors[0] ?? null;
    case "status": return STATUSES.indexOf(b.status);
    case "rating": return b.rating;
    case "total_pages": return b.total_pages;
    default: return b[k] ?? null;
  }
}

export default function LibraryPage() {
  const { books, loading, openBook, openAdd } = useStore();
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<BookStatus | "all">("all");
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "created_at", dir: -1 });
  const [view, setView] = useState<"table" | "cards">("table");

  const genres = useMemo(() => [...new Set(books.map((b) => b.genre).filter(Boolean))].sort() as string[], [books]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: books.length };
    for (const s of STATUSES) c[s] = books.filter((b) => b.status === s).length;
    return c;
  }, [books]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const collator = new Intl.Collator(lang === "ko" ? "ko" : "en", { numeric: true });
    return books
      .filter((b) => tab === "all" || b.status === tab)
      .filter((b) => !genre || b.genre === genre)
      .filter((b) => !needle || [b.title, b.subtitle, b.publisher, b.genre, ...b.authors].some((v) => v?.toLowerCase().includes(needle)))
      .sort((a, b) => {
        const va = sortValue(a, sort.key);
        const vb = sortValue(b, sort.key);
        if (va == null && vb == null) return 0;
        if (va == null) return 1; // empty values always last
        if (vb == null) return -1;
        const r = typeof va === "number" && typeof vb === "number" ? va - vb : collator.compare(String(va), String(vb));
        return r * sort.dir;
      });
  }, [books, tab, genre, q, sort, lang]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key.endsWith("_at") || key === "rating" ? -1 : 1 }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {(["all", ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${tab === s ? "bg-stone-800 text-white" : "bg-white text-stone-600 hover:bg-stone-100"}`}>
            {s !== "all" && <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s].hex }} />}
            {s === "all" ? t("all") : t(`status_${s}`)} <span className="opacity-60">{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} max-w-[10rem]`} value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">{t("genre")}: {t("all")}</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        {view === "cards" && (
          <select className={`${inputCls} max-w-[12rem]`} value={`${sort.key}:${sort.dir}`}
            onChange={(e) => { const [k, d] = e.target.value.split(":"); setSort({ key: k as SortKey, dir: Number(d) as 1 | -1 }); }}>
            {COLUMNS.flatMap((c) => [1, -1].map((d) => (
              <option key={`${c.key}:${d}`} value={`${c.key}:${d}`}>{t("sortBy")}: {t(c.label)} {d === 1 ? "↑" : "↓"}</option>
            )))}
          </select>
        )}
        <span className="text-sm text-stone-500">{rows.length} {t("books")}</span>
        <div className="ml-auto flex gap-1">
          <Button variant={view === "table" ? "primary" : "outline"} onClick={() => setView("table")}>{t("tableView")}</Button>
          <Button variant={view === "cards" ? "primary" : "outline"} onClick={() => setView("cards")}>{t("cardView")}</Button>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-stone-400">{t("loading")}</p>
      ) : books.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-3 text-stone-500">{t("emptyLibrary")}</p>
          <Button onClick={() => openAdd()}>＋ {t("addBook")}</Button>
        </div>
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 text-left text-xs text-stone-500">
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} className={`cursor-pointer select-none px-3 py-2.5 font-medium hover:text-stone-800 ${c.className ?? ""}`} onClick={() => toggleSort(c.key)}>
                    {t(c.label)} {sort.key === c.key ? (sort.dir === 1 ? "↑" : "↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((b) => (
                <tr key={b.id} className="cursor-pointer hover:bg-stone-50" onClick={() => openBook(b.id)}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <Cover src={b.cover_url} title="" className="h-10 w-7 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">{b.title}</p>
                        {b.subtitle && <p className="text-xs text-stone-500">{b.subtitle}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-stone-600">{b.authors.join(", ")}</td>
                  <td className="hidden px-3 py-2 text-stone-600 md:table-cell">{b.publisher}</td>
                  <td className="hidden px-3 py-2 text-stone-600 md:table-cell">{b.genre}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={b.status} />
                    {b.status === "reading" && b.total_pages ? <span className="ml-1 text-xs text-stone-400">{percent(b.current_page, b.total_pages)}%</span> : null}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2 text-stone-600 sm:table-cell">{fmtDate(b.started_at)}</td>
                  <td className="hidden whitespace-nowrap px-3 py-2 text-stone-600 sm:table-cell">{fmtDate(b.finished_at)}</td>
                  <td className="hidden px-3 py-2 text-stone-600 lg:table-cell">{b.total_pages ?? "-"}</td>
                  <td className="hidden px-3 py-2 lg:table-cell">{b.rating != null ? <StarRating value={b.rating} size={14} /> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {rows.map((b) => (
            <button key={b.id} onClick={() => openBook(b.id)} className="group text-left">
              <Cover src={b.cover_url} title={b.title} className="aspect-[2/3] w-full group-hover:shadow-md" />
              <p className="mt-1.5 line-clamp-2 text-sm font-medium">{b.title}</p>
              <p className="truncate text-xs text-stone-500">{b.authors.join(", ")}</p>
              {b.status === "reading" && b.total_pages ? (
                <div className="mt-1"><ProgressBar value={percent(b.current_page, b.total_pages)} color={STATUS_COLORS.reading.hex} /></div>
              ) : (
                <div className="mt-1"><StatusBadge status={b.status} /></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
