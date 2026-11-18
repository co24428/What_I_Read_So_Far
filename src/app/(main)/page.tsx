"use client";
import { Calendar } from "@/components/Calendar";
import { PageTransition } from "@/components/PageTransition";
import { Button, Cover, ProgressBar, Skeleton, cardCls } from "@/components/ui";
import { percent } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { STATUS_COLORS } from "@/lib/types";

export default function HomePage() {
  const { books, loading, error, openBook, openAdd } = useStore();
  const { t } = useI18n();
  const reading = books.filter((b) => b.status === "reading");
  const soon = books.filter((b) => b.status === "soon");

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;

  return (
    <PageTransition>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {loading ? <Skeleton className="h-[520px] rounded-2xl" /> : <div className="animate-rise"><Calendar books={books} onOpen={openBook} /></div>}
        <aside className="space-y-6">
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: STATUS_COLORS.reading.hex }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: STATUS_COLORS.reading.hex }} />
              </span>
              {t("status_reading")} · {reading.length}
            </h3>
            {loading && <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-[84px] rounded-2xl" />)}</div>}
            {!loading && books.length === 0 && (
              <div className={`${cardCls} animate-rise p-6 text-center`}>
                <div className="mb-2 text-4xl">📖</div>
                <p className="mb-3 text-sm text-stone-500">{t("emptyLibrary")}</p>
                <Button onClick={() => openAdd({ status: "reading" })}>＋ {t("addFirst")}</Button>
              </div>
            )}
            <ul className="stagger space-y-2">
              {reading.map((b) => {
                const pct = percent(b.current_page, b.total_pages);
                const left = b.total_pages ? b.total_pages - b.current_page : null;
                return (
                  <li key={b.id}>
                    <button onClick={() => openBook(b.id)}
                      className={`${cardCls} group flex w-full gap-3 p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]`}>
                      <Cover src={b.cover_url} title={b.title} className="h-16 w-11 shrink-0 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{b.title}</p>
                        <p className="truncate text-xs text-stone-500">{b.authors.join(", ")}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <ProgressBar value={pct} color={STATUS_COLORS.reading.hex} className="h-1.5" />
                          <span className="shrink-0 text-xs font-medium tabular-nums text-stone-600">{b.total_pages ? `${pct}%` : `p.${b.current_page}`}</span>
                        </div>
                        {left != null && left > 0 && (
                          <p className="mt-0.5 h-0 overflow-hidden text-[11px] text-stone-400 opacity-0 transition-all duration-200 group-hover:h-4 group-hover:opacity-100">
                            {left} {t("pagesLeft")}
                          </p>
                        )}
                      </div>
                      <span className="self-center text-stone-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-stone-500">›</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          {soon.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-stone-500">{t("status_soon")} · {soon.length}</h3>
              <ul className="stagger space-y-0.5">
                {soon.map((b) => (
                  <li key={b.id}>
                    <button onClick={() => openBook(b.id)}
                      className="group flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition-colors hover:bg-white hover:shadow-sm">
                      <span className="h-2 w-2 shrink-0 rounded-full transition-transform group-hover:scale-125" style={{ background: STATUS_COLORS.soon.hex }} />
                      <span className="truncate">{b.title}</span>
                      <span className="ml-auto text-stone-300 opacity-0 transition-opacity group-hover:opacity-100">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </PageTransition>
  );
}
