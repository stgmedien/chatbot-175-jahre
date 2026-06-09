import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ESG-Erzählbot · 175 Jahre",
  description:
    "Entdecke 175 Jahre Evangelisch-Stiftisches Gymnasium Gütersloh – Geschichte, Gegenwart und Zukunft zum Anklicken und Fragen.",
};

// interactiveWidget: "resizes-content" → die Bildschirmtastatur verkleinert das
// Layout-Viewport (und damit dvh + sticky bottom-0), statt die Eingabe zu verdecken.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-esg-border bg-esg-card/80 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
            <Link href="/" className="text-sm font-semibold tracking-tight text-esg-primary">
              ESG&nbsp;·&nbsp;175 Jahre
            </Link>
            <span className="text-xs text-esg-muted">1000 Fenster, unendlich viele Geschichten</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6">{children}</main>
        <footer className="border-t border-esg-border px-5 py-4 text-center text-xs text-esg-muted">
          Evangelisch-Stiftisches Gymnasium Gütersloh · Archivstand Mai 2026
        </footer>
      </body>
    </html>
  );
}
