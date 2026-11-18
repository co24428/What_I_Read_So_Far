"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button, inputCls } from "@/components/ui";

export default function LoginPage() {
  const { t, lang, setLang } = useI18n();
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } else {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className="text-4xl">📚</div>
          <h1 className="mt-2 text-lg font-bold">{t("appName")}</h1>
        </div>
        <input type="password" autoFocus className={inputCls} placeholder={t("password")} value={pw} onChange={(e) => setPw(e.target.value)} />
        {error && <p className="text-sm text-red-600">{t("wrongPassword")}</p>}
        <Button type="submit" disabled={busy || !pw} className="w-full">{t("enter")}</Button>
        <button type="button" className="w-full text-xs text-stone-400" onClick={() => setLang(lang === "ko" ? "en" : "ko")}>
          {lang === "ko" ? "English" : "한국어"}
        </button>
      </form>
    </div>
  );
}
