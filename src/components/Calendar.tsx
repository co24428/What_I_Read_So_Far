"use client";
import { useMemo, useState } from "react";
import type { Book } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/types";
import { localToday } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "./ui";

const LANE_H = 24;
const DAY_HEADER_H = 26;

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

interface Span { book: Book; start: string; end: string; ongoing: boolean }
interface Segment { span: Span; col: number; len: number; isStart: boolean; isEnd: boolean; lane: number }

/** Book reading range: start date → finish date, or → today while still reading. */
function spanOf(book: Book, today: string): Span | null {
  if (!book.started_at) return null;
  let end: string;
  let ongoing = false;
  if (book.finished_at) end = book.finished_at;
  else if (book.status === "reading") { end = today; ongoing = true; }
  else end = book.started_at;
  if (end < book.started_at) end = book.started_at;
  return { book, start: book.started_at, end, ongoing };
}

export function Calendar({ books, onOpen }: { books: Book[]; onOpen: (id: string) => void }) {
  const { t, lang } = useI18n();
  const today = localToday();
  const [cursor, setCursor] = useState(() => { const d = parse(today); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const spans = useMemo(() => books.map((b) => spanOf(b, today)).filter((s): s is Span => !!s)
    .sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end)), [books, today]);

  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    let ws = addDays(first, -first.getDay());
    const out: { days: Date[]; segments: Segment[]; lanes: number }[] = [];
    while (ws <= last) {
      const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
      const wsKey = toKey(days[0]);
      const weKey = toKey(days[6]);
      const laneEnds: number[] = []; // last occupied column per lane
      const segments: Segment[] = [];
      for (const span of spans) {
        if (span.end < wsKey || span.start > weKey) continue;
        const sKey = span.start < wsKey ? wsKey : span.start;
        const eKey = span.end > weKey ? weKey : span.end;
        const col = days.findIndex((d) => toKey(d) === sKey);
        const endCol = days.findIndex((d) => toKey(d) === eKey);
        let lane = laneEnds.findIndex((e) => e < col);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(endCol); } else laneEnds[lane] = endCol;
        segments.push({ span, col, len: endCol - col + 1, isStart: span.start >= wsKey, isEnd: span.end <= weKey, lane });
      }
      out.push({ days, segments, lanes: laneEnds.length });
      ws = addDays(ws, 7);
    }
    return out;
  }, [cursor, spans]);

  const monthLabel = cursor.toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long" });
  const weekdays = t("weekdays").split(",");
  const hasAny = weeks.some((w) => w.segments.length > 0);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</Button>
        <Button variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</Button>
        <h2 className="ml-2 text-lg font-semibold">{monthLabel}</h2>
        <Button variant="ghost" className="ml-auto" onClick={() => { const d = parse(today); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}>
          {t("today")}
        </Button>
      </div>

      <div className="grid grid-cols-7 border-b border-stone-200 pb-1 text-center text-xs font-medium text-stone-500">
        {weekdays.map((w, i) => (
          <div key={w} className={i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}>{w}</div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="relative border-b border-stone-100"
          style={{ minHeight: Math.max(84, DAY_HEADER_H + week.lanes * LANE_H + 8) }}>
          <div className="absolute inset-0 grid grid-cols-7">
            {week.days.map((d) => {
              const key = toKey(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              return (
                <div key={key} className={`border-r border-stone-100 px-1.5 pt-1 text-xs last:border-r-0 ${inMonth ? "" : "bg-stone-50/70 text-stone-300"}`}>
                  <span className={key === today ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 font-semibold text-white" : ""}>
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
          {week.segments.map((seg) => {
            const c = STATUS_COLORS[seg.span.book.status].hex;
            return (
              <button key={`${seg.span.book.id}-${wi}`} onClick={() => onOpen(seg.span.book.id)}
                title={`${seg.span.book.title} (${seg.span.start} ~ ${seg.span.ongoing ? t("today") : seg.span.end})`}
                className="group absolute flex items-center px-0.5"
                style={{ top: DAY_HEADER_H + seg.lane * LANE_H, left: `${(seg.col / 7) * 100}%`, width: `${(seg.len / 7) * 100}%`, height: LANE_H - 4 }}>
                {seg.isStart ? (
                  <span className="max-w-full shrink-0 truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight text-white shadow-sm group-hover:brightness-110"
                    style={{ background: c, maxWidth: seg.len === 1 ? "100%" : "85%" }}>
                    {seg.span.book.title}
                  </span>
                ) : (
                  <span className="shrink-0 truncate pr-1 text-[10px] opacity-70" style={{ color: c, maxWidth: "60%" }}>
                    {seg.span.book.title}
                  </span>
                )}
                <span className="h-[3px] min-w-0 flex-1 rounded-full" style={{ background: c, opacity: 0.6 }} />
                {seg.isEnd && (seg.span.ongoing
                  ? <span className="shrink-0 text-[10px] leading-none" style={{ color: c }}>▶</span>
                  : seg.len > 1 || !seg.isStart ? <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} /> : null)}
              </button>
            );
          })}
        </div>
      ))}
      {!hasAny && <p className="pt-4 text-center text-sm text-stone-400">{t("noBooksInMonth")}</p>}
    </div>
  );
}
