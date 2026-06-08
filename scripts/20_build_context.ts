// Bündelt die kuratierten Archiv-Dateien zu EINER Wissensbasis, die zur Laufzeit
// in den (gecachten) System-Prompt von Claude geht. Dadurch ist kein Vektor-Index /
// keine Embeddings nötig – der Korpus ist klein und fix.
//   Aufruf:  npm run build:context   (tsx, cwd = webapp/)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "..");
const SRC_DIR = join(ROOT, "04_Fobizz_KI_Wissensbasis");
const OUT_DIR = join(process.cwd(), "data");
const OUT = join(OUT_DIR, "wissensbasis.json");

// Reihenfolge = grobe Wichtigkeit (dichte Fakten zuerst).
const FILES = [
  "ESG_Kurzprofil.md",
  "ESG_Kritische_Fakten_und_Standardantworten.md",
  "ESG_Gesamtchronik_kompakt.md",
  "ESG_Themenwissen.md",
  "ESG_Jubilaeum_175_Jahre.md",
  "ESG_Begriffe_und_Synonyme.md",
  "ESG_Haeufige_Fragen_FAQ.md",
  "ESG_SuperKI_Schnellantworten.md",
  "ESG_Historische_Dokumente_Funde.md",
];

const parts: string[] = [];
const used: string[] = [];
for (const f of FILES) {
  const p = join(SRC_DIR, f);
  if (!existsSync(p)) {
    console.warn(`  übersprungen (fehlt): ${f}`);
    continue;
  }
  const body = readFileSync(p, "utf8").trim();
  parts.push(`===== Quelle: ${f} =====\n\n${body}`);
  used.push(f);
}

const text = parts.join("\n\n\n");
const approxTokens = Math.round(text.length / 4); // grobe Schätzung

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ chars: text.length, approxTokens, files: used, text }, null, 0) + "\n",
  "utf8",
);
console.log(
  `✓ wissensbasis.json: ${used.length} Dateien, ${text.length} Zeichen (~${approxTokens} Tokens) → ${OUT}`,
);
