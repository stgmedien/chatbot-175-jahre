import type { Persona, ToneTier, AgeBand, Role } from "./types";

export const STORAGE_KEY = "esg-persona";

export const AGE_OPTIONS: { value: AgeBand; label: string }[] = [
  { value: "schueler", label: "Schüler:in" },
  { value: "18-35", label: "18–35" },
  { value: "36-60", label: "36–60" },
  { value: "60plus", label: "60+" },
];

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "ehemalige", label: "Ehemalige:r" },
  { value: "eltern", label: "Eltern" },
  { value: "lehrkraft", label: "Lehrkraft" },
  { value: "gast", label: "Gast / Neugierig" },
];

/** Bildet Alter + Rolle auf genau eine der drei vorgenerierten Ton-Stufen ab. */
export function toneForPersona(p: Persona | null): ToneTier {
  if (!p) return "erwachsene";
  if (p.age === "schueler") return "kind";
  if (p.role === "lehrkraft" || p.role === "ehemalige") return "fach";
  return "erwachsene";
}

export const TONE_LABELS: Record<ToneTier, string> = {
  kind: "Einfach",
  erwachsene: "Standard",
  fach: "Ausführlich",
};

/**
 * Einzeiler-Instruktion für den Live-RAG-Prompt. Wird BEWUSST nach dem
 * eingefrorenen, gecachten System+Korpus-Präfix injiziert (cache-freundlich).
 */
export function personaPromptSuffix(p: Persona | null): string {
  switch (toneForPersona(p)) {
    case "kind":
      return "Antworte einfach, lebendig und kurz – so, dass eine Schülerin oder ein Schüler es gut versteht.";
    case "fach":
      return "Antworte ausführlich und fachlich fundiert, mit konkreten Jahreszahlen und der jeweiligen Archivquelle.";
    default:
      return "Antworte freundlich, klar und in mittlerer Ausführlichkeit für erwachsene Besucherinnen und Besucher.";
  }
}

/** Kurzer Stil-Hinweis (Phrase) für den Live-Prompt, abgeleitet aus der Ton-Stufe. */
export function suffixForTier(tier: ToneTier): string {
  switch (tier) {
    case "kind":
      return "einfach, lebendig und kurz – für eine Schülerin oder einen Schüler";
    case "fach":
      return "ausführlich und fachlich, mit Jahreszahlen und Quelle";
    default:
      return "freundlich, klar und mittel-ausführlich für Erwachsene";
  }
}
