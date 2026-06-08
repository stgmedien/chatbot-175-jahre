"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona, useAgeConfirmed, confirmAge } from "@/lib/clientState";
import { toneForPersona } from "@/lib/persona";

interface AskResult {
  antwort: string;
  quellen: string[];
  hinweis?: string;
}

export default function AskBox() {
  const persona = usePersona();
  const ageStored = useAgeConfirmed();
  const [confirmedHere, setConfirmedHere] = useState(false);
  const [frage, setFrage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowed = ageStored || confirmedHere;

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = frage.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frage: q, tier: toneForPersona(persona), over18: true }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Es ist ein Fehler aufgetreten.");
      else setResult(data as AskResult);
    } catch {
      setError("Netzwerkfehler – bitte versuch es erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-esg-border bg-esg-card p-5">
        <p className="font-medium text-esg-primary">Eigene Fragen ab 18 Jahren</p>
        <p className="mt-1 text-sm text-esg-muted">
          Um eigene Fragen einzutippen, bestätige bitte, dass du 18 Jahre oder älter bist. Die
          geführten Pfade kannst du jederzeit ohne Bestätigung erkunden.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => {
              confirmAge();
              setConfirmedHere(true);
            }}
            className="rounded-full bg-esg-primary px-5 py-2 text-sm font-medium text-white hover:bg-esg-primary-700"
          >
            Ich bin 18 oder älter
          </button>
          <Link
            href="/hub"
            className="rounded-full border border-esg-border px-5 py-2 text-sm font-medium text-esg-primary hover:bg-background"
          >
            Zu den Pfaden
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={ask} className="flex flex-col gap-3">
        <textarea
          value={frage}
          onChange={(e) => setFrage(e.target.value)}
          placeholder="z. B. Seit wann gibt es den Posaunenchor?"
          rows={3}
          className="w-full resize-none rounded-xl border border-esg-border bg-esg-card p-3 outline-none focus:border-esg-primary"
        />
        <button
          type="submit"
          disabled={loading || !frage.trim()}
          className="self-start rounded-full bg-esg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-esg-primary-700 disabled:opacity-50"
        >
          {loading ? "Suche im Archiv…" : "Fragen"}
        </button>
      </form>

      {error && (
        <p className="rounded-xl border border-esg-accent/40 bg-esg-accent/5 p-3 text-sm text-esg-accent">
          {error}
        </p>
      )}

      {result && (
        <article className="rounded-2xl border border-esg-border bg-esg-card p-5">
          <p className="whitespace-pre-line leading-relaxed">{result.antwort}</p>
          {result.quellen?.length > 0 && (
            <p className="mt-3 text-xs text-esg-muted">Quelle: {result.quellen.join(", ")}</p>
          )}
          {result.hinweis && <p className="mt-2 text-xs italic text-esg-muted">{result.hinweis}</p>}
        </article>
      )}
    </div>
  );
}
