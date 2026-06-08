"use client";
import { useState } from "react";
import type { ToneTier, TieredAnswer, ImageEntry } from "@/lib/types";
import { usePersona } from "@/lib/clientState";
import { toneForPersona } from "@/lib/persona";
import ToneTabs from "./ToneTabs";
import ImageWithRights from "./ImageWithRights";

export interface ViewFaq {
  id: string;
  frage: string;
  antwort: TieredAnswer;
  images: ImageEntry[];
  citations: string[];
}

export default function FaqList({ items }: { items: ViewFaq[] }) {
  const persona = usePersona();
  const [override, setOverride] = useState<ToneTier | null>(null);
  const tier = override ?? toneForPersona(persona);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ToneTabs value={tier} onChange={setOverride} />
      </div>

      <div className="flex flex-col gap-2">
        {items.map((f) => (
          <details
            key={f.id}
            className="rounded-xl border border-esg-border bg-esg-card p-4 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none font-medium text-esg-primary marker:content-none">
              {f.frage}
            </summary>
            <p className="mt-2 whitespace-pre-line leading-relaxed">{f.antwort[tier]}</p>
            {f.images.length > 0 && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {f.images.map((img) => (
                  <ImageWithRights key={img.bildId} img={img} />
                ))}
              </div>
            )}
            {f.citations.length > 0 && (
              <p className="mt-2 text-xs text-esg-muted">Quelle: {f.citations.join(", ")}</p>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
