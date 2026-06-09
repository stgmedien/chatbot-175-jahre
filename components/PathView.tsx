"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import type { ToneTier, ViewNode, ViewPath, PathOption } from "@/lib/types";
import { usePersona } from "@/lib/clientState";
import { toneForPersona } from "@/lib/persona";
import ToneTabs from "./ToneTabs";
import ImageWithRights from "./ImageWithRights";

type Msg =
  | { kind: "intro"; text: string }
  | { kind: "user"; text: string }
  | { kind: "answer"; node: ViewNode };

export default function PathView({ path }: { path: ViewPath }) {
  const persona = usePersona();
  const [override, setOverride] = useState<ToneTier | null>(null);
  const tier = override ?? toneForPersona(persona);

  const byId = useMemo(
    () => Object.fromEntries(path.nodes.map((n) => [n.id, n] as const)),
    [path.nodes],
  );

  // Start: nur Begrüßung + die 3 Einstiegs-Optionen – noch KEINE Antwort.
  const [thread, setThread] = useState<Msg[]>(() => [{ kind: "intro", text: path.intro }]);
  const [options, setOptions] = useState<PathOption[]>(() => path.startOptionen);
  const stepCount = thread.filter((m) => m.kind === "answer").length;

  const endRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return; // beim Laden nicht ans Ende springen
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length]);

  function choose(opt: PathOption) {
    const node = byId[opt.ziel];
    if (!node) return;
    setThread((t) => [...t, { kind: "user", text: opt.label }, { kind: "answer", node }]);
    setOptions(node.optionen);
  }

  function restart() {
    setThread([{ kind: "intro", text: path.intro }]);
    setOptions(path.startOptionen);
  }

  const done = options.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-esg-primary">{path.titel}</h1>
        <ToneTabs value={tier} onChange={setOverride} />
      </div>

      {/* Chatverlauf */}
      <div className="flex flex-col gap-3">
        {thread.map((m, i) => (
          <Bubble key={i} m={m} tier={tier} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Was möchtest du als Nächstes? – immer (bis zu) 3 Optionen */}
      <div className="flex flex-col gap-2 border-t border-esg-border pt-4">
        {done ? (
          <div className="flex flex-col gap-2">
            <p className="text-esg-muted">
              Schön, dass du dabei warst! Magst du einen anderen Abzweig dieses Pfads nehmen?
            </p>
            <button
              onClick={restart}
              className="self-start rounded-xl border border-esg-primary bg-esg-primary/5 px-4 py-3 text-left font-medium text-esg-primary transition-colors hover:bg-esg-primary/10"
            >
              ↻ Den Pfad neu beginnen
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-esg-muted">
              {stepCount === 0 ? "Womit möchtest du starten?" : "Wie möchtest du weitermachen?"}
            </p>
            {options.map((opt, i) => (
              <button
                key={`${opt.ziel}-${i}`}
                onClick={() => choose(opt)}
                className="rounded-xl border border-esg-primary bg-esg-primary/5 px-4 py-3 text-left font-medium text-esg-primary transition-colors hover:bg-esg-primary/10"
              >
                → {opt.label}
              </button>
            ))}
            {stepCount > 0 && (
              <button
                onClick={restart}
                className="mt-1 self-start text-sm text-esg-muted underline-offset-2 hover:underline"
              >
                ↻ Von vorn
              </button>
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
  const n = m.node;
  return (
    <div className="max-w-[92%] self-start rounded-2xl rounded-bl-sm border border-esg-border bg-esg-card p-4">
      <p className="whitespace-pre-line leading-relaxed">{n.antwort[tier]}</p>
      {n.images.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {n.images.map((img) => (
            <ImageWithRights key={img.bildId} img={img} />
          ))}
        </div>
      )}
      {n.citations.length > 0 && (
        <p className="mt-2 text-xs text-esg-muted">Quelle: {n.citations.join(", ")}</p>
      )}
    </div>
  );
}
