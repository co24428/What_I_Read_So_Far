"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Button } from "./ui";

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

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2">
        <Link href="/" className="mr-3 font-bold tracking-tight">📚 {t("appName")}</Link>
        <nav className="flex gap-1">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-stone-800 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
                {t(l.key)}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Button onClick={() => openAdd()}>＋ {t("addBook")}</Button>
          <Button variant="ghost" onClick={() => setLang(lang === "ko" ? "en" : "ko")} title="Language">
            {lang === "ko" ? "EN" : "한국어"}
          </Button>
          <Button variant="ghost" onClick={logout}>{t("logout")}</Button>
        </div>
      </div>
    </header>
  );
}
