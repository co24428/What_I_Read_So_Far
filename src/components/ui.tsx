"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { STATUSES, STATUS_COLORS, type BookStatus } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // don't scroll the page behind the sheet
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex justify-center bg-stone-900/40 backdrop-blur-[2px] sm:items-start sm:overflow-y-auto sm:p-10" onMouseDown={onClose}>
      {/* Phone: full-screen sheet sliding up. Desktop: centred dialog scaling in. */}
      <div
        className={`animate-sheet-up sm:animate-dialog-in pt-safe pb-safe h-dvh w-full overflow-y-auto overscroll-contain bg-white sm:h-auto sm:overflow-visible sm:rounded-3xl sm:shadow-2xl sm:ring-1 sm:ring-black/5 ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- Button ---------------- */
export function Button({
  children, onClick, variant = "primary", type = "button", disabled, className = "", title,
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger" | "outline";
  type?: "button" | "submit"; disabled?: boolean; className?: string; title?: string;
}) {
  const styles = {
    primary: "bg-stone-900 text-white shadow-sm hover:bg-stone-700 hover:shadow-md",
    outline: "border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
    ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
    danger: "text-red-600 hover:bg-red-50",
  }[variant];
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick}
      className={`inline-flex shrink-0 select-none items-center justify-center gap-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 ${styles} ${className}`}>
      {children}
    </button>
  );
}

export const inputCls =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:ring-4 focus:ring-stone-100";

/* ---------------- Status ---------------- */
export function StatusBadge({ status }: { status: BookStatus }) {
  const { t } = useI18n();
  const c = STATUS_COLORS[status].hex;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-colors"
      style={{ background: `${c}1a`, color: "#44403c" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {t(`status_${status}`)}
    </span>
  );
}

export function StatusSelect({ value, onChange }: { value: BookStatus; onChange: (s: BookStatus) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map((s) => {
        const on = value === s;
        const c = STATUS_COLORS[s].hex;
        return (
          <button key={s} type="button" onClick={() => onChange(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ${on ? "text-white shadow-sm" : "border-stone-200 bg-white text-stone-600 hover:-translate-y-px hover:border-stone-300 hover:shadow-sm"}`}
            style={on ? { background: c, borderColor: c, boxShadow: `0 4px 12px -4px ${c}` } : undefined}>
            {t(`status_${s}`)}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Stars: hover previews the score ---------------- */
export function StarRating({ value, onChange, size = 20 }: { value: number | null; onChange?: (v: number | null) => void; size?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const v = hover ?? value ?? 0;
  return (
    <div className="inline-flex" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = v >= i ? 100 : v >= i - 0.5 ? 50 : 0;
        return (
          <span key={i} className={`relative inline-block transition-transform duration-150 ${onChange ? "hover:scale-125" : ""}`} style={{ width: size, height: size }}>
            <span className="absolute inset-0 text-stone-200" style={{ fontSize: size, lineHeight: 1 }}>★</span>
            <span className={`absolute inset-0 overflow-hidden transition-[width] duration-150 ${hover != null ? "text-amber-300" : "text-amber-400"}`}
              style={{ width: `${fill}%`, fontSize: size, lineHeight: 1 }}>★</span>
            {onChange && (
              <>
                <button type="button" aria-label={`${i - 0.5}`} className="absolute inset-y-0 left-0 w-1/2"
                  onMouseEnter={() => setHover(i - 0.5)} onClick={() => onChange(value === i - 0.5 ? null : i - 0.5)} />
                <button type="button" aria-label={`${i}`} className="absolute inset-y-0 right-0 w-1/2"
                  onMouseEnter={() => setHover(i)} onClick={() => onChange(value === i ? null : i)} />
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ---------------- Cover ---------------- */
const PLACEHOLDERS = [
  ["#fde68a", "#f59e0b"], ["#bae6fd", "#0284c7"], ["#bbf7d0", "#059669"], ["#fbcfe8", "#db2777"],
  ["#ddd6fe", "#7c3aed"], ["#fed7aa", "#ea580c"], ["#e7e5e4", "#57534e"],
];
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Book cover, or a coloured "book spine" placeholder derived from the title. Fades in when loaded. */
export function Cover({ src, title, className = "", hideTitle }: { src: string | null; title: string; className?: string; hideTitle?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const [a, b] = PLACEHOLDERS[hash(title || "?") % PLACEHOLDERS.length];
    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-md p-1.5 text-center shadow-sm ring-1 ring-black/5 ${className}`}
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
        <span className="absolute inset-y-0 left-0 w-[6%] bg-black/10" />
        {!hideTitle && <span className="line-clamp-3 text-[11px] font-semibold leading-tight text-white drop-shadow-sm">{title}</span>}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external cover hosts vary
    <img src={src} alt={title} onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
      className={`rounded-md bg-stone-100 object-cover shadow-sm ring-1 ring-black/5 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`} />
  );
}

/* ---------------- Progress bar: fills in on mount ---------------- */
export function ProgressBar({ value, color = "#0ea5e9", className = "h-2" }: { value: number; color?: string; className?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  return (
    <div className={`w-full overflow-hidden rounded-full bg-stone-100 ${className}`}>
      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${shown}%`, background: color }} />
    </div>
  );
}

/* ---------------- Number that counts up ---------------- */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString() }: { value: number; format?: (n: number) => string }) {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 700);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(a + (value - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(n)}</>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}

export const cardCls = "rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-8px_rgba(0,0,0,0.08)] ring-1 ring-stone-900/5";
