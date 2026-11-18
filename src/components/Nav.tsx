"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Button } from "./ui";

const svg = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ICONS: Record<string, ReactNode> = {
  "/": svg(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  "/library": svg(<><path d="M4 4h4v16H4zM10 4h4v16h-4z" /><path d="m16 5 3.5-1 3 15.5-3.5 1z" /></>),
  "/stats": svg(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  "/tree": svg(<><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M12 7.5v4M12 11.5 5 16.5M12 11.5l7 5" /></>),
};

const LINKS: { href: string; key: DictKey }[] = [
  { href: "/", key: "navCalendar" },
  { href: "/library", key: "navLibrary" },
  { href: "/stats", key: "navStats" },
  { href: "/tree", key: "navTree" },
];

export function Nav() {
  const path = usePathname();
  const { t, lang, setLang } = useI18n();
  const { openAdd } = useStore();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const activeIdx = LINKS.findIndex((l) => isActive(l.href));
  // Tabs to the right slide in from the right, tabs to the left from the left (like iOS)
  const dir = (i: number) => (i > activeIdx ? ["tab-forward"] : ["tab-back"]);

  // Sliding highlight behind the active desktop link
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = navRef.current?.querySelectorAll<HTMLElement>("a")[activeIdx];
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  }, [activeIdx, lang]);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <>
      <header className="pt-safe sticky top-0 z-40 border-b border-stone-200/70 bg-white/80 backdrop-blur-xl" style={{ viewTransitionName: "site-header" }}>
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2">
          <Link href="/" transitionTypes={dir(0)} className="group mr-3 flex items-center gap-1.5 truncate font-bold tracking-tight">
            <span className="inline-block transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110">📚</span>
            {t("appName")}
          </Link>
          <nav ref={navRef} className="relative hidden gap-1 md:flex">
            {pill && (
              <span className="absolute inset-y-0 rounded-xl bg-stone-900 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ left: pill.left, width: pill.width }} />
            )}
            {LINKS.map((l, i) => (
              <Link key={l.href} href={l.href} transitionTypes={dir(i)}
                className={`relative z-10 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${isActive(l.href) ? "text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"}`}>
                {t(l.key)}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden md:block"><Button onClick={() => openAdd()}>＋ {t("addBook")}</Button></span>
            <Button variant="ghost" onClick={() => setLang(lang === "ko" ? "en" : "ko")} title="Language">
              {lang === "ko" ? "EN" : "한"}
            </Button>
            <Button variant="ghost" onClick={logout}>{t("logout")}</Button>
          </div>
        </div>
      </header>

      {/* Phone: bottom tab bar with a centre "add" button */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/70 bg-white/85 backdrop-blur-xl md:hidden" style={{ viewTransitionName: "tab-bar" }}>
        <div className="grid grid-cols-5 items-end">
          {LINKS.slice(0, 2).map((l, i) => <Tab key={l.href} href={l.href} label={t(l.key)} active={isActive(l.href)} types={dir(i)} />)}
          <div className="flex justify-center pb-1.5">
            <button onClick={() => openAdd()} aria-label={t("addBook")}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-3xl font-light text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] ring-4 ring-white transition-transform duration-200 active:scale-90">
              ＋
            </button>
          </div>
          {LINKS.slice(2).map((l, i) => <Tab key={l.href} href={l.href} label={t(l.key)} active={isActive(l.href)} types={dir(i + 2)} />)}
        </div>
      </nav>
    </>
  );
}

function Tab({ href, label, active, types }: { href: string; label: string; active: boolean; types: string[] }) {
  return (
    <Link href={href} transitionTypes={types}
      className={`relative flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-medium transition-colors duration-200 active:scale-95 ${active ? "text-stone-900" : "text-stone-400"}`}>
      {/* key forces the pop animation each time the tab becomes active */}
      <span key={String(active)} className={active ? "animate-pop" : ""}>{ICONS[href]}</span>
      {label}
      <span className={`absolute top-0 h-0.5 rounded-full bg-stone-900 transition-all duration-300 ${active ? "w-6 opacity-100" : "w-0 opacity-0"}`} />
    </Link>
  );
}
