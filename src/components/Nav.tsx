"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <>
      <header className="pt-safe sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2">
          <Link href="/" className="mr-3 truncate font-bold tracking-tight">📚 {t("appName")}</Link>
          <nav className="hidden gap-1 md:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${isActive(l.href) ? "bg-stone-800 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
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
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 items-end">
          {LINKS.slice(0, 2).map((l) => <Tab key={l.href} href={l.href} label={t(l.key)} active={isActive(l.href)} />)}
          <div className="flex justify-center pb-1.5">
            <button onClick={() => openAdd()} aria-label={t("addBook")}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-stone-800 text-3xl font-light text-white shadow-lg active:scale-95">
              ＋
            </button>
          </div>
          {LINKS.slice(2).map((l) => <Tab key={l.href} href={l.href} label={t(l.key)} active={isActive(l.href)} />)}
        </div>
      </nav>
    </>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-medium ${active ? "text-stone-900" : "text-stone-400"}`}>
      {ICONS[href]}
      {label}
    </Link>
  );
}
