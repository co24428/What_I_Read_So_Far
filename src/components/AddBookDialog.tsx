"use client";
import { useState } from "react";
import type { Book, BookCandidate, BookInput } from "@/lib/types";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { BookForm } from "./BookForm";
import { Button, Cover, Modal, inputCls } from "./ui";

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
    const { addOpts, closeAdd, upsertLocal } = useStore();
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
      } catch (err) {
        setError((err as Error).message);
        setBusy(false);
      }
    };

    return (
      <div className="p-5">
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
            <form onSubmit={search} className="flex gap-2">
              <input autoFocus className={inputCls} placeholder={t("searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
              <Button type="submit" disabled={searching}>{t("search")}</Button>
              <Button variant="outline" onClick={() => setDraft({ title: "", status: defaultStatus, source: "manual" })}>
                {t("manualEntry")}
              </Button>
            </form>
            <div className="mt-4 max-h-[60vh] space-y-1 overflow-y-auto">
              {searching && <p className="py-6 text-center text-sm text-stone-500">{t("loading")}</p>}
              {busy && <p className="py-2 text-center text-sm text-stone-500">{t("loading")}</p>}
              {results?.length === 0 && <p className="py-6 text-center text-sm text-stone-500">{t("noResults")}</p>}
              {results?.map((r, i) => (
                <button key={`${r.isbn13}-${i}`} onClick={() => pick(r)} disabled={busy}
                  className="flex w-full gap-3 rounded-lg p-2 text-left hover:bg-stone-100">
                  <Cover src={r.cover_url ?? null} title={r.title} className="h-20 w-14 shrink-0" />
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
