"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import type { ToneTier, ViewStation } from "@/lib/types";
import { usePersona } from "@/lib/clientState";
import { toneForPersona } from "@/lib/persona";
import ToneTabs from "./ToneTabs";
import ImageWithRights from "./ImageWithRights";

type Msg =
  | { kind: "intro"; text: string }
  | { kind: "user"; text: string }
  | { kind: "answer"; station: ViewStation };

export default function PathView({
  titel,
  stations,
}: {
  titel: string;
  stations: ViewStation[];
}) {
  const persona = usePersona();
  const [override, setOverride] = useState<ToneTier | null>(null);
  const tier = override ?? toneForPersona(persona);

  const byId = useMemo(
    () => Object.fromEntries(stations.map((s) => [s.id, s] as const)),
    [stations],
  );
  const first = stations[0];

  // Direkt aus den Props initialisieren → erste Station ist sofort (auch serverseitig) da.
  const [thread, setThread] = useState<Msg[]>(() =>
    first
      ? [
          { kind: "intro", text: `Willkommen beim Pfad „${titel}“! Los geht’s 👇` },
          { kind: "user", text: first.frage },
          { kind: "answer", station: first },
        ]
      : [],
  );
  const [seen, setSeen] = useState<Set<string>>(() => new Set(first ? [first.id] : []));
  const [current, setCurrent] = useState<string | null>(first?.id ?? null);

  const endRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return; // beim Laden nicht ans Ende springen
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length]);

  function choose(id: string) {
    const st = byId[id];
    if (!st) return;
    setThread((t) => [...t, { kind: "user", text: st.frage }, { kind: "answer", station: st }]);
    setSeen((s) => new Set(s).add(id));
    setCurrent(id);
  }

  const cur = current ? byId[current] : null;
  const nextSteps = (cur?.weiter ?? []).map((id) => byId[id]).filter((s) => s && !seen.has(s.id));
  const others = stations.filter(
    (s) => !seen.has(s.id) && !nextSteps.some((n) => n.id === s.id),
  );
  const done = nextSteps.length === 0 && others.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-esg-primary">{titel}</h1>
        <ToneTabs value={tier} onChange={setOverride} />
      </div>

      {/* Chatverlauf */}
      <div className="flex flex-col gap-3">
        {thread.map((m, i) => (
          <Bubble key={i} m={m} tier={tier} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Was möchtest du als Nächstes? */}
      <div className="flex flex-col gap-2 border-t border-esg-border pt-4">
        {done ? (
          <p className="text-esg-muted">
            Das war der Pfad „{titel}“ – schön, dass du dabei warst! 🎉
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-esg-muted">Was möchtest du als Nächstes wissen?</p>
            {nextSteps.map((s) => (
              <button
                key={s.id}
                onClick={() => choose(s.id)}
                className="rounded-xl border border-esg-primary bg-esg-primary/5 px-4 py-3 text-left font-medium text-esg-primary transition-colors hover:bg-esg-primary/10"
              >
                → {s.frage}
              </button>
            ))}
            {others.length > 0 && (
              <details className="mt-1">
                <summary className="cursor-pointer list-none text-sm text-esg-muted marker:content-none">
                  Oder direkt springen zu …
                </summary>
                <div className="mt-2 flex flex-col gap-2">
                  {others.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => choose(s.id)}
                      className="rounded-lg border border-esg-border bg-esg-card px-4 py-2 text-left text-sm text-esg-primary transition-colors hover:border-esg-primary"
                    >
                      {s.frage}
                    </button>
                  ))}
                </div>
              </details>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/hub"
            className="rounded-full border border-esg-border px-5 py-2 text-sm font-medium text-esg-primary hover:bg-esg-card"
          >
            ← Andere Pfade
          </Link>
          <Link
            href="/frage"
            className="rounded-full bg-esg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            💬 Eigene Frage
          </Link>
        </div>
      </div>
    </div>
  );
}

function Bubble({ m, tier }: { m: Msg; tier: ToneTier }) {
  if (m.kind === "user") {
    return (
      <div className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-esg-primary px-4 py-2 text-white">
        {m.text}
      </div>
    );
  }
  if (m.kind === "intro") {
    return (
      <div className="max-w-[85%] self-start rounded-2xl rounded-bl-sm border border-esg-border bg-esg-card px-4 py-2">
        {m.text}
      </div>
    );
  }
  const s = m.station;
  return (
    <div className="max-w-[92%] self-start rounded-2xl rounded-bl-sm border border-esg-border bg-esg-card p-4">
      <p className="whitespace-pre-line leading-relaxed">{s.antwort[tier]}</p>
      {s.images.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {s.images.map((img) => (
            <ImageWithRights key={img.bildId} img={img} />
          ))}
        </div>
      )}
      {s.citations.length > 0 && (
        <p className="mt-2 text-xs text-esg-muted">Quelle: {s.citations.join(", ")}</p>
      )}
    </div>
  );
}
