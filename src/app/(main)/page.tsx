"use client";
import { Calendar } from "@/components/Calendar";
import { Cover, ProgressBar } from "@/components/ui";
import { percent } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { STATUS_COLORS } from "@/lib/types";

export default function HomePage() {
  const { books, loading, error, openBook } = useStore();
  const { t } = useI18n();
  const reading = books.filter((b) => b.status === "reading");
  const soon = books.filter((b) => b.status === "soon");

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Calendar books={books} onOpen={openBook} />
      <aside className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-stone-500">{t("status_reading")} · {reading.length}</h3>
          {loading && <p className="text-sm text-stone-400">{t("loading")}</p>}
          <ul className="space-y-2">
            {reading.map((b) => {
              const pct = percent(b.current_page, b.total_pages);
              return (
                <li key={b.id}>
                  <button onClick={() => openBook(b.id)} className="flex w-full gap-3 rounded-xl bg-white p-2.5 text-left shadow-sm hover:shadow">
                    <Cover src={b.cover_url} title={b.title} className="h-16 w-11 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.title}</p>
                      <p className="truncate text-xs text-stone-500">{b.authors.join(", ")}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <ProgressBar value={pct} color={STATUS_COLORS.reading.hex} />
                        <span className="shrink-0 text-xs text-stone-500">{b.total_pages ? `${pct}%` : `p.${b.current_page}`}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        {soon.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-stone-500">{t("status_soon")} · {soon.length}</h3>
            <ul className="space-y-1">
              {soon.map((b) => (
                <li key={b.id}>
                  <button onClick={() => openBook(b.id)} className="w-full truncate rounded-lg px-2 py-1 text-left text-sm hover:bg-white">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: STATUS_COLORS.soon.hex }} />
                    {b.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
