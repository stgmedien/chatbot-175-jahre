import Link from "next/link";
import { publishedPfade } from "@/lib/data";

// Einstiegsfragen, die direkt in den Chat springen (Auto-Send über ?q=).
const CHAT_CHIPS = [
  "Wann wurde das ESG gegründet?",
  "Zeig mir das Schulgebäude von 1928!",
  "Wie feierte das ESG frühere Jubiläen?",
];

export default function HubPage() {
  const pfade = publishedPfade();

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Chat zuerst: der Erzählbot ist der Star */}
      <section className="rounded-3xl bg-esg-primary p-6 text-white shadow-md">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">
          Dein Erzählbot
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-snug">
          Frag mich alles über 175 Jahre ESG
        </h1>
        <p className="mt-2 max-w-prose text-sm text-white/85">
          Ich antworte live aus dem Schularchiv – mit Quellen und historischen Fotos.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {CHAT_CHIPS.map((c) => (
            <Link
              key={c}
              href={`/frage?q=${encodeURIComponent(c)}`}
              className="flex min-h-[44px] items-center rounded-full border border-white/25 bg-white/10 px-4 text-sm transition-colors hover:bg-white/20"
            >
              {c}
            </Link>
          ))}
        </div>
        <Link
          href="/frage"
          className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-6 font-medium text-esg-primary transition-opacity hover:opacity-90"
        >
          💬 Chat starten →
        </Link>
      </section>

      {/* Pfade als kompakte Zweit-Ebene */}
      <section className="flex flex-col gap-3">
        <header>
          <h2 className="text-lg font-semibold tracking-tight text-esg-primary">
            Oder nimm eine kleine Klick-Tour
          </h2>
          <p className="text-sm text-esg-muted">
            Geführte Pfade mit Verzweigungen – du entscheidest an jeder Station, wie es weitergeht.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {pfade.map((p) => (
            <Link
              key={p.slug}
              href={`/pfad/${p.slug}`}
              className="flex items-start gap-3 rounded-2xl border border-esg-border bg-esg-card p-4 transition-colors hover:border-esg-primary"
            >
              <span className="text-2xl" aria-hidden>
                {p.icon}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold leading-snug text-esg-primary">{p.titel}</span>
                <span className="text-sm leading-snug text-esg-muted">{p.kurz}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Link
        href="/faq"
        className="flex items-center justify-between rounded-2xl border border-esg-border bg-esg-card px-5 py-4 font-medium text-esg-primary transition-colors hover:border-esg-primary"
      >
        <span>❓ Häufige Fragen</span>
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
