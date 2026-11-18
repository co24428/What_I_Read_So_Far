"use client";
import { useCallback, useEffect, useState } from "react";
import type { Book, BookInput, ProgressLog, Review } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/types";
import { api, fmtDate, localToday, percent } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { BookForm } from "./BookForm";
import { Button, Cover, Modal, ProgressBar, StarRating, StatusBadge, StatusSelect, inputCls } from "./ui";

export function BookDetailModal() {
  const { openBookId, closeBook } = useStore();
  return (
    <Modal open={!!openBookId} onClose={closeBook} wide>
      {openBookId && <Detail key={openBookId} id={openBookId} />}
    </Modal>
  );
}

function Detail({ id }: { id: string }) {
  const { t } = useI18n();
  const { closeBook, upsertLocal, removeLocal } = useStore();
  const [book, setBook] = useState<Book | null>(null);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<{ book: Book; logs: ProgressLog[]; reviews: Review[] }>(`/api/books/${id}`);
      setBook(d.book);
      setLogs(d.logs);
      setReviews(d.reviews);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on open
    void load();
  }, [load]);

  const patch = async (body: BookInput) => {
    try {
      const b = await api<Book>(`/api/books/${id}`, { method: "PATCH", body });
      setBook(b);
      upsertLocal(b);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async () => {
    if (!confirm(t("confirmDelete"))) return;
    await api(`/api/books/${id}`, { method: "DELETE" });
    removeLocal(id);
    closeBook();
  };

  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!book) return <div className="p-10 text-center text-sm text-stone-500">{t("loading")}</div>;

  if (editing)
    return (
      <div className="p-5">
        <h2 className="mb-4 text-lg font-semibold">{t("edit")}</h2>
        <BookForm initial={book} onSubmit={patch} onCancel={() => setEditing(false)} />
      </div>
    );

  const pct = percent(book.current_page, book.total_pages);

  return (
    <div className="p-5">
      <div className="flex justify-end gap-1">
        <Button variant="ghost" onClick={() => setEditing(true)}>{t("edit")}</Button>
        <Button variant="danger" onClick={remove}>{t("delete")}</Button>
        <Button variant="ghost" onClick={closeBook}>✕</Button>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row">
        <Cover src={book.cover_url} title={book.title} className="h-56 w-40 shrink-0 self-center sm:self-start" />
        <div className="min-w-0 flex-1 space-y-2">
          <StatusBadge status={book.status} />
          <h2 className="text-2xl font-bold leading-tight">{book.title}</h2>
          {book.subtitle && <p className="text-stone-500">{book.subtitle}</p>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pt-2 text-sm">
            <Row label={t("authors")} value={book.authors.join(", ")} />
            {book.translators.length > 0 && <Row label={t("translators")} value={book.translators.join(", ")} />}
            <Row label={t("publisher")} value={book.publisher} />
            <Row label={t("publishedDate")} value={fmtDate(book.published_date)} />
            <Row label={t("genre")} value={book.genre} />
            <Row label={t("totalPages")} value={book.total_pages ? String(book.total_pages) : null} />
            {book.isbn13 && <Row label={t("isbn")} value={book.isbn13} />}
            <Row label={t("startedAt")} value={fmtDate(book.started_at)} />
            <Row label={t("finishedAt")} value={fmtDate(book.finished_at)} />
          </dl>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-medium text-stone-500">{t("rating")}</span>
            <StarRating value={book.rating} onChange={(v) => patch({ rating: v })} />
            {book.rating != null && <span className="text-sm text-stone-500">{book.rating}</span>}
          </div>
          <div className="pt-1">
            <StatusSelect value={book.status} onChange={(s) => patch({ status: s })} />
          </div>
        </div>
      </div>

      {book.description && <p className="mt-4 whitespace-pre-line text-sm text-stone-600">{book.description}</p>}

      <ProgressSection book={book} logs={logs} onChanged={async () => { await load(); }} onBook={(b) => { setBook(b); upsertLocal(b); }} pct={pct} />
      <ReviewSection bookId={id} reviews={reviews} setReviews={setReviews} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <>
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-stone-800">{value || "-"}</dd>
    </>
  );
}

function ProgressSection({
  book, logs, onChanged, onBook, pct,
}: { book: Book; logs: ProgressLog[]; onChanged: () => Promise<void>; onBook: (b: Book) => void; pct: number }) {
  const { t } = useI18n();
  const [page, setPage] = useState("");
  const [date, setDate] = useState(localToday());
  const [showHistory, setShowHistory] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (page === "") return;
    const b = await api<Book>(`/api/books/${book.id}/progress`, { method: "POST", body: { page: Number(page), logged_on: date } });
    onBook(b);
    setPage("");
    await onChanged();
  };
  const removeLog = async (logId: string) => {
    await api(`/api/books/${book.id}/progress?log=${logId}`, { method: "DELETE" });
    await onChanged();
  };

  return (
    <section className="mt-6 rounded-xl bg-stone-50 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-semibold">{t("progress")}</h3>
        <span className="text-sm text-stone-600">
          {book.current_page} / {book.total_pages ?? "?"} {t("pages")} {book.total_pages ? `(${pct}%)` : ""}
        </span>
      </div>
      <ProgressBar value={pct} color={STATUS_COLORS[book.status].hex} />
      <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="number" min={0} max={book.total_pages ?? undefined} placeholder={t("nowOnPage")}
          className={`${inputCls} !w-32`} value={page} onChange={(e) => setPage(e.target.value)} />
        <input type="date" className={`${inputCls} !w-40`} value={date} onChange={(e) => setDate(e.target.value)} />
        <Button type="submit">{t("record")}</Button>
        {logs.length > 0 && (
          <Button variant="ghost" onClick={() => setShowHistory((v) => !v)}>
            {t("history")} ({logs.length}) {showHistory ? "▲" : "▼"}
          </Button>
        )}
      </form>
      {showHistory && (
        <ul className="mt-2 divide-y divide-stone-200 text-sm">
          {[...logs].reverse().map((l) => (
            <li key={l.id} className="flex items-center justify-between py-1">
              <span>{fmtDate(l.logged_on)} — p.{l.page}</span>
              <button className="text-xs text-stone-400 hover:text-red-600" onClick={() => removeLog(l.id)}>{t("delete")}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewSection({ bookId, reviews, setReviews }: { bookId: string; reviews: Review[]; setReviews: (r: Review[]) => void }) {
  const { t, lang } = useI18n();
  const [text, setText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const r = await api<Review>(`/api/books/${bookId}/reviews`, { method: "POST", body: { content: text } });
    setReviews([...reviews, r]);
    setText("");
  };
  const saveEdit = async () => {
    const r = await api<Review>(`/api/reviews/${editId}`, { method: "PATCH", body: { content: editText } });
    setReviews(reviews.map((x) => (x.id === r.id ? r : x)));
    setEditId(null);
  };
  const remove = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    await api(`/api/reviews/${id}`, { method: "DELETE" });
    setReviews(reviews.filter((x) => x.id !== id));
  };
  const when = (s: string) =>
    new Date(s).toLocaleString(lang === "ko" ? "ko-KR" : "en-US", { dateStyle: "medium", timeStyle: "short" });

  return (
    <section className="mt-6">
      <h3 className="mb-3 font-semibold">{t("reviews")}</h3>
      {reviews.length === 0 && <p className="mb-3 text-sm text-stone-400">{t("noReviews")}</p>}
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border border-stone-200 p-3">
            <div className="mb-1 flex items-center justify-between text-xs text-stone-400">
              <span>{when(r.created_at)}{r.updated_at !== r.created_at ? " ✎" : ""}</span>
              <span className="flex gap-2">
                <button className="hover:text-stone-700" onClick={() => { setEditId(r.id); setEditText(r.content); }}>{t("edit")}</button>
                <button className="hover:text-red-600" onClick={() => remove(r.id)}>{t("delete")}</button>
              </span>
            </div>
            {editId === r.id ? (
              <div className="space-y-2">
                <textarea rows={3} className={inputCls} value={editText} onChange={(e) => setEditText(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditId(null)}>{t("cancel")}</Button>
                  <Button onClick={saveEdit}>{t("save")}</Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-line text-sm text-stone-800">{r.content}</p>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={post} className="mt-3 flex items-end gap-2">
        <textarea rows={2} className={inputCls} placeholder={t("writeReview")} value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit">{t("post")}</Button>
      </form>
    </section>
  );
}
