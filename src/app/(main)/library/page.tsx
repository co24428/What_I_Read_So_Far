"use client";
import { useMemo, useState } from "react";
import type { Book, BookStatus } from "@/lib/types";
import { STATUSES, STATUS_COLORS } from "@/lib/types";
import { fmtDate, percent } from "@/lib/client";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Button, Cover, ProgressBar, Skeleton, StarRating, StatusBadge, cardCls, inputCls } from "@/components/ui";
import { PageTransition } from "@/components/PageTransition";

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
    <PageTransition>
    <div className="space-y-4">
      <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {(["all", ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${tab === s ? "bg-stone-900 text-white shadow-md" : "bg-white text-stone-600 ring-1 ring-stone-900/5 hover:-translate-y-px hover:shadow-sm"}`}>
            {s !== "all" && <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s].hex }} />}
            {s === "all" ? t("all") : t(`status_${s}`)} <span className="opacity-60">{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input className={`${inputCls} pl-9`} placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
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
        {/* Segmented control with a sliding thumb */}
        <div className="relative ml-auto grid grid-cols-2 rounded-xl bg-stone-200/60 p-0.5 text-sm font-medium">
          <span className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-[10px] bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${view === "cards" ? "translate-x-full" : ""}`} />
          {(["table", "cards"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`relative z-10 px-3 py-1 transition-colors ${view === v ? "text-stone-900" : "text-stone-500 hover:text-stone-700"}`}>
              {t(v === "table" ? "tableView" : "cardView")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : books.length === 0 ? (
        <div className="animate-rise py-16 text-center">
          <div className="mb-3 text-5xl">📚</div>
          <p className="mb-4 text-stone-500">{t("emptyLibrary")}</p>
          <Button onClick={() => openAdd()}>＋ {t("addFirst")}</Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="animate-fade-in py-16 text-center text-sm text-stone-400">{t("noResults")}</p>
      ) : view === "table" ? (
        <div key={`${tab}-${genre}`} className={`${cardCls} animate-rise overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 text-left text-xs text-stone-500">
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} className={`group cursor-pointer select-none whitespace-nowrap px-3 py-2.5 font-medium transition-colors hover:text-stone-900 ${sort.key === c.key ? "text-stone-900" : ""} ${c.className ?? ""}`} onClick={() => toggleSort(c.key)}>
                    {t(c.label)}
                    <span className={`ml-1 inline-block transition-all duration-200 ${sort.key === c.key ? "opacity-100" : "opacity-0 group-hover:opacity-40"} ${sort.key === c.key && sort.dir === -1 ? "rotate-180" : ""}`}>↑</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="stagger divide-y divide-stone-100">
              {rows.map((b) => (
                <tr key={b.id} className="group cursor-pointer transition-colors duration-150 hover:bg-stone-50/80" onClick={() => openBook(b.id)}>
                  <td className="relative px-3 py-2">
                    <span className="absolute inset-y-2 left-0 w-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100" style={{ background: STATUS_COLORS[b.status].hex }} />
                    <div className="flex items-center gap-2.5">
                      <Cover src={b.cover_url} title={b.title} hideTitle className="h-10 w-7 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      <div className="min-w-0">
                        <p className="font-medium transition-colors group-hover:text-stone-950">{b.title}</p>
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
        <div key={`${tab}-${genre}`} className="stagger grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {rows.map((b) => (
            <button key={b.id} onClick={() => openBook(b.id)} className="group text-left [perspective:800px] active:scale-[0.97]">
              <div className="relative transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:[transform:rotateY(-8deg)]">
                <Cover src={b.cover_url} title={b.title} className="aspect-[2/3] w-full transition-shadow duration-300 group-hover:shadow-[8px_12px_24px_-8px_rgba(0,0,0,0.35)]" />
                {b.rating != null && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
                    ★ {b.rating}
                  </span>
                )}
              </div>
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
    </PageTransition>
  );
}
