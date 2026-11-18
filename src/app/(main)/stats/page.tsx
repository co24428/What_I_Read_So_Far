"use client";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { STATUSES, STATUS_COLORS } from "@/lib/types";
import { inputCls } from "@/components/ui";

interface Stats {
  year: number;
  years: number[];
  monthly: { month: number; pages: number; finished: number; started: number }[];
  yearly: { year: number; pages: number; finished: number; started: number }[];
  genres: { name: string; count: number }[];
  authors: { name: string; count: number }[];
  publishers: { name: string; count: number }[];
  totals: { pages: number; finished: number; avgRating: number | null; library: number; byStatus: Record<string, number> };
}

const BAR = "#4f46e5"; // single-series hue
const AXIS = { fontSize: 10, fill: "#78716c" };

export default function StatsPage() {
  const { t, lang } = useI18n();
  const [year, setYear] = useState<number | null>(null);
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Stats>(`/api/stats${year ? `?year=${year}` : ""}`).then(setData).catch((e) => setError(e.message));
  }, [year]);

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="py-10 text-center text-sm text-stone-400">{t("loading")}</p>;

  // Short labels so all 12 months fit on a phone
  const monthName = (m: number) => (lang === "ko" ? `${m}월` : new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "narrow" }));
  const monthly = data.monthly.map((m) => ({ ...m, label: monthName(m.month) }));
  const num = (n: number) => n.toLocaleString(lang === "ko" ? "ko-KR" : "en-US");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="whitespace-nowrap text-xl font-bold">{t("navStats")}</h1>
        <select className={`${inputCls} !w-28`} value={data.year} onChange={(e) => setYear(Number(e.target.value))}>
          {data.years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label={`${data.year} ${t("pagesRead")}`} value={num(data.totals.pages)} />
        <Tile label={`${data.year} ${t("booksFinished")}`} value={num(data.totals.finished)} />
        <Tile label={t("avgRating")} value={data.totals.avgRating != null ? `★ ${data.totals.avgRating.toFixed(1)}` : "-"} />
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">{t("navLibrary")} · {data.totals.library}</p>
          <ul className="mt-1.5 space-y-0.5 text-xs">
            {STATUSES.map((s) => (
              <li key={s} className="flex items-center gap-1.5 text-stone-600">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s].hex }} />
                {t(`status_${s}`)} <span className="ml-auto font-medium text-stone-800">{data.totals.byStatus[s]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={`${t("byMonth")} · ${t("pagesRead")}`}>
          <SimpleBars data={monthly} x="label" y="pages" unit={t("pages")} />
        </ChartCard>
        <ChartCard title={`${t("byMonth")} · ${t("booksFinished")}`}>
          <SimpleBars data={monthly} x="label" y="finished" unit={t("books")} allowDecimals={false} />
        </ChartCard>
        <ChartCard title={`${t("byYear")} · ${t("pagesRead")}`}>
          <SimpleBars data={data.yearly} x="year" y="pages" unit={t("pages")} />
        </ChartCard>
        <ChartCard title={`${t("byYear")} · ${t("booksFinished")}`}>
          <SimpleBars data={data.yearly} x="year" y="finished" unit={t("books")} allowDecimals={false} />
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <RankList title={`${data.year} · ${t("topGenres")}`} items={data.genres} unit={t("books")} />
        <RankList title={`${data.year} · ${t("topAuthors")}`} items={data.authors} unit={t("books")} />
        <RankList title={`${data.year} · ${t("topPublishers")}`} items={data.publishers} unit={t("books")} />
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-stone-600">{title}</h2>
      <div className="h-56">{children}</div>
    </section>
  );
}

function SimpleBars({ data, x, y, unit, allowDecimals = true }: { data: object[]; x: string; y: string; unit: string; allowDecimals?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="25%">
        <CartesianGrid vertical={false} stroke="#e7e5e4" />
        <XAxis dataKey={x} tick={AXIS} tickLine={false} axisLine={{ stroke: "#d6d3d1" }} interval={0} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={allowDecimals} />
        <Tooltip cursor={{ fill: "#f5f5f4" }} formatter={(v) => [`${Number(v).toLocaleString()} ${unit}`, ""]} separator="" />
        <Bar dataKey={y} fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RankList({ title, items, unit }: { title: string; items: { name: string; count: number }[]; unit: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-stone-600">{title}</h2>
      {items.length === 0 && <p className="text-sm text-stone-400">-</p>}
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.name} className="text-sm" title={`${i.name}: ${i.count} ${unit}`}>
            <div className="flex justify-between text-stone-700">
              <span className="truncate">{i.name}</span>
              <span className="shrink-0 tabular-nums text-stone-500">{i.count}</span>
            </div>
            <div className="mt-0.5 h-1.5 rounded-full bg-stone-100">
              <div className="h-full rounded-full" style={{ width: `${(i.count / max) * 100}%`, background: BAR }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
