"use client";
import { useStore } from "@/lib/store";

const ICON = { success: "✓", error: "!", info: "i" };

export function Toaster() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="animate-rise flex items-center gap-2.5 rounded-full bg-stone-900/95 py-2 pl-2 pr-4 text-sm font-medium text-white shadow-xl backdrop-blur">
          <span className={`animate-pop flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
            t.tone === "error" ? "bg-red-500" : t.tone === "info" ? "bg-sky-500" : "bg-emerald-500"}`}>
            {ICON[t.tone]}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
