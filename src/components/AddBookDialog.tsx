"use client";
import { useState } from "react";
import type { Book, BookCandidate, BookInput } from "@/lib/types";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { BookForm } from "./BookForm";
import { Button, Cover, Modal, Skeleton, inputCls } from "./ui";

export function AddBookDialog() {
  const { addOpts, closeAdd } = useStore();
  const open = addOpts !== null;
  return (
    <Modal open={open} onClose={closeAdd} wide>
      {open && <AddBookInner />}
    </Modal>
  );
}

function AddBookInner() {
    const { addOpts, closeAdd, upsertLocal, toast } = useStore();
    const { t } = useI18n();
    const [q, setQ] = useState("");
    const [results, setResults] = useState<BookCandidate[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [draft, setDraft] = useState<BookInput | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const defaultStatus = addOpts?.status ?? "want";

    const search = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!q.trim()) return;
      setSearching(true);
      setError(null);
      try {
        setResults(await api<BookCandidate[]>(`/api/search?q=${encodeURIComponent(q)}`));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSearching(false);
      }
    };

    const pick = async (c: BookCandidate) => {
      setBusy(true);
      let extra: Partial<BookCandidate> = {};
      if (c.isbn13) {
        try {
          extra = await api<Partial<BookCandidate>>(`/api/search?isbn=${c.isbn13}`);
        } catch { /* NLK is optional */ }
      }
      setBusy(false);
      // Kakao cover wins; NLK fills pages, genre and a better subtitle
      setDraft({ ...c, ...extra, cover_url: c.cover_url || extra.cover_url || null, subtitle: extra.subtitle || c.subtitle, status: defaultStatus });
    };

    const save = async (b: BookInput) => {
      setBusy(true);
      setError(null);
      try {
        const created = await api<Book>("/api/books", { method: "POST", body: b });
        upsertLocal(created);
        addOpts?.onAdded?.(created);
        closeAdd();
        toast(t("toastAdded"));
      } catch (err) {
        setError((err as Error).message);
        setBusy(false);
      }
    };

    return (
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("addBook")}</h2>
          <Button variant="ghost" onClick={closeAdd}>✕</Button>
        </div>
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {draft ? (
          <>
            <Button variant="ghost" className="mb-3" onClick={() => setDraft(null)}>← {t("back")}</Button>
            <BookForm initial={draft} onSubmit={save} onCancel={closeAdd} busy={busy} />
          </>
        ) : (
          <>
            <form onSubmit={search} className="flex flex-wrap gap-2 sm:flex-nowrap">
              <input autoFocus className={`${inputCls} min-w-0 flex-1 basis-full sm:basis-auto`} placeholder={t("searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
              <Button type="submit" disabled={searching}>{t("search")}</Button>
              <Button variant="outline" onClick={() => setDraft({ title: "", status: defaultStatus, source: "manual" })}>
                {t("manualEntry")}
              </Button>
            </form>
            <div className="mt-4 space-y-1 sm:max-h-[60vh] sm:overflow-y-auto">
              {searching && [0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-2">
                  <Skeleton className="h-20 w-14 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
                </div>
              ))}
              {busy && <div className="h-1 overflow-hidden rounded-full"><div className="skeleton h-full w-full" /></div>}
              {results?.length === 0 && <p className="py-6 text-center text-sm text-stone-500">{t("noResults")}</p>}
              {!searching && results?.map((r, i) => (
                <button key={`${r.isbn13}-${i}`} onClick={() => pick(r)} disabled={busy}
                  style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                  className="group flex w-full animate-rise gap-3 rounded-xl p-2 text-left transition-all duration-150 hover:bg-stone-50 hover:shadow-sm active:scale-[0.99]">
                  <Cover src={r.cover_url ?? null} title={r.title} className="h-20 w-14 shrink-0 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105" />
                  <div className="min-w-0">
                    <p className="font-medium">{r.title}</p>
                    {r.subtitle && <p className="text-sm text-stone-500">{r.subtitle}</p>}
                    <p className="text-xs text-stone-500">
                      {[r.authors?.join(", "), r.publisher, r.published_date?.slice(0, 4)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
