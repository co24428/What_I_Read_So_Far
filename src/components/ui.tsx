"use client";
import { useEffect, type ReactNode } from "react";
import { STATUSES, STATUS_COLORS, type BookStatus } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

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
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40 sm:items-start sm:overflow-y-auto sm:p-10" onMouseDown={onClose}>
      {/* Phone: full-screen sheet that scrolls on its own. Desktop: centred dialog. */}
      <div
        className={`pt-safe pb-safe h-dvh w-full overflow-y-auto overscroll-contain bg-white sm:h-auto sm:overflow-visible sm:rounded-2xl sm:shadow-xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function Button({
  children, onClick, variant = "primary", type = "button", disabled, className = "", title,
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger" | "outline";
  type?: "button" | "submit"; disabled?: boolean; className?: string; title?: string;
}) {
  const styles = {
    primary: "bg-stone-800 text-white hover:bg-stone-700",
    outline: "border border-stone-300 text-stone-700 hover:bg-stone-100",
    ghost: "text-stone-600 hover:bg-stone-100",
    danger: "text-red-600 hover:bg-red-50",
  }[variant];
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick}
      className={`inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${styles} ${className}`}>
      {children}
    </button>
  );
}

export const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200";

export function StatusBadge({ status }: { status: BookStatus }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
      <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[status].hex }} />
      {t(`status_${status}`)}
    </span>
  );
}

export function StatusSelect({ value, onChange }: { value: BookStatus; onChange: (s: BookStatus) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-1">
      {STATUSES.map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${value === s ? "text-white" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
          style={value === s ? { background: STATUS_COLORS[s].hex, borderColor: STATUS_COLORS[s].hex } : undefined}>
          {t(`status_${s}`)}
        </button>
      ))}
    </div>
  );
}

/** 5 stars, half-star steps. Click the same value again to clear. */
export function StarRating({ value, onChange, size = 20 }: { value: number | null; onChange?: (v: number | null) => void; size?: number }) {
  const v = value ?? 0;
  return (
    <div className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = v >= i ? 100 : v >= i - 0.5 ? 50 : 0;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <span className="absolute inset-0 text-stone-300" style={{ fontSize: size, lineHeight: 1 }}>★</span>
            <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${fill}%`, fontSize: size, lineHeight: 1 }}>★</span>
            {onChange && (
              <>
                <button type="button" aria-label={`${i - 0.5}`} className="absolute inset-y-0 left-0 w-1/2"
                  onClick={() => onChange(v === i - 0.5 ? null : i - 0.5)} />
                <button type="button" aria-label={`${i}`} className="absolute inset-y-0 right-0 w-1/2"
                  onClick={() => onChange(v === i ? null : i)} />
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function Cover({ src, title, className = "" }: { src: string | null; title: string; className?: string }) {
  if (!src)
    return (
      <div className={`flex items-center justify-center rounded bg-gradient-to-br from-stone-200 to-stone-300 p-2 text-center text-xs font-medium text-stone-600 ${className}`}>
        {title}
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element -- external cover hosts vary
  return <img src={src} alt={title} className={`rounded object-cover shadow-sm ${className}`} />;
}

export function ProgressBar({ value, color = "#0ea5e9" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}
