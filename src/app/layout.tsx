import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "What I Read So Far · 지금까지 읽은 책",
  description: "My reading log",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "읽은 책", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // draw under the iPhone notch / home bar; we pad with safe-area insets
  themeColor: "#fafaf9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-stone-50 text-stone-900 antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
