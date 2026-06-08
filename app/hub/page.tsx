import Link from "next/link";
import { publishedPfade } from "@/lib/data";

export default function HubPage() {
  const pfade = publishedPfade();

  return (
    <div className="flex flex-col gap-7 py-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-esg-primary">Wähle deinen Weg</h1>
        <p className="text-esg-muted">
          Klick dich durch einen Pfad – oder stell uns direkt deine eigene Frage.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {pfade.map((p) => (
          <Link
            key={p.slug}
            href={`/pfad/${p.slug}`}
            className="flex flex-col gap-1 rounded-2xl border border-esg-border bg-esg-card p-5 shadow-sm transition-colors hover:border-esg-primary"
          >
            <span className="text-2xl" aria-hidden>
              {p.icon}
            </span>
            <span className="font-semibold text-esg-primary">{p.titel}</span>
            <span className="text-sm text-esg-muted">{p.kurz}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/faq"
          className="flex items-center justify-between rounded-2xl border border-esg-border bg-esg-card px-5 py-4 font-medium text-esg-primary transition-colors hover:border-esg-primary"
        >
          <span>❓ Häufige Fragen</span>
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="/frage"
          className="flex items-center justify-between rounded-2xl bg-esg-accent px-5 py-4 font-medium text-white transition-opacity hover:opacity-90"
        >
          <span>💬 Frag mich direkt etwas</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
