"use client";
import type { ToneTier } from "@/lib/types";
import { TONE_LABELS } from "@/lib/persona";

const ORDER: ToneTier[] = ["kind", "erwachsene", "fach"];

export default function ToneTabs({
  value,
  onChange,
}: {
  value: ToneTier;
  onChange: (t: ToneTier) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-esg-border bg-esg-card p-1 text-sm">
      {ORDER.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          aria-pressed={value === t}
          className={`rounded-full px-3 py-1 transition-colors ${
            value === t ? "bg-esg-primary text-white" : "text-esg-muted hover:text-esg-primary"
          }`}
        >
          {TONE_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
