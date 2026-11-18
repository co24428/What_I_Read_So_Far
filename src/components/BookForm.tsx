"use client";
import { useState } from "react";
import type { BookInput } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { Button, Cover, Field, StarRating, StatusSelect, inputCls } from "./ui";

type FormState = BookInput & { authorsText: string; translatorsText: string };

export function BookForm({
  initial, onSubmit, onCancel, busy,
}: {
  initial: BookInput; onSubmit: (b: BookInput) => void; onCancel: () => void; busy?: boolean;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<FormState>({
    status: "want",
    ...initial,
    authorsText: (initial.authors ?? []).join(", "),
    translatorsText: (initial.translators ?? []).join(", "),
  });
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));
  const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { authorsText, translatorsText, ...rest } = f;
    onSubmit({
      ...rest,
      authors: split(authorsText),
      translators: split(translatorsText),
      total_pages: rest.total_pages ? Number(rest.total_pages) : null,
      current_page: rest.current_page ? Number(rest.current_page) : 0,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-4">
        <Cover src={f.cover_url ?? null} title={f.title || "?"} className="h-36 w-24 shrink-0" />
        <div className="flex-1 space-y-3">
          <Field label={`${t("title")} *`}>
            <input required className={inputCls} value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label={t("subtitle")}>
            <input className={inputCls} value={f.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t("authors")} (${t("commaHint")})`}>
          <input className={inputCls} value={f.authorsText} onChange={(e) => set("authorsText", e.target.value)} />
        </Field>
        <Field label={`${t("translators")} (${t("commaHint")})`}>
          <input className={inputCls} value={f.translatorsText} onChange={(e) => set("translatorsText", e.target.value)} />
        </Field>
        <Field label={t("publisher")}>
          <input className={inputCls} value={f.publisher ?? ""} onChange={(e) => set("publisher", e.target.value)} />
        </Field>
        <Field label={t("publishedDate")}>
          <input type="date" className={inputCls} value={f.published_date ?? ""} onChange={(e) => set("published_date", e.target.value)} />
        </Field>
        <Field label={t("genre")}>
          <input className={inputCls} value={f.genre ?? ""} onChange={(e) => set("genre", e.target.value)} />
        </Field>
        <Field label={t("totalPages")}>
          <input type="number" min={0} className={inputCls} value={f.total_pages ?? ""}
            onChange={(e) => set("total_pages", e.target.value === "" ? null : Number(e.target.value))} />
        </Field>
        <Field label={t("isbn")}>
          <input className={inputCls} value={f.isbn13 ?? ""} onChange={(e) => set("isbn13", e.target.value)} />
        </Field>
        <Field label={t("coverUrl")}>
          <input className={inputCls} value={f.cover_url ?? ""} onChange={(e) => set("cover_url", e.target.value)} />
        </Field>
      </div>
      <Field label={t("status")}>
        <StatusSelect value={f.status ?? "want"} onChange={(s) => set("status", s)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("startedAt")}>
          <input type="date" className={inputCls} value={f.started_at ?? ""} onChange={(e) => set("started_at", e.target.value)} />
        </Field>
        <Field label={t("finishedAt")}>
          <input type="date" className={inputCls} value={f.finished_at ?? ""} onChange={(e) => set("finished_at", e.target.value)} />
        </Field>
      </div>
      <Field label={t("rating")}>
        <StarRating value={f.rating ?? null} onChange={(v) => set("rating", v)} size={24} />
      </Field>
      <Field label={t("description")}>
        <textarea rows={3} className={inputCls} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
        <Button type="submit" disabled={busy}>{t("save")}</Button>
      </div>
    </form>
  );
}
