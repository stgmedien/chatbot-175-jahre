// Baut data/image-manifest.json aus 05_Bilder_und_Medien/Bildquellen_Index.json.
// Real ausführbar, braucht weder API-Key noch echte Bilddateien.
//   Aufruf:  npm run build:manifest   (tsx, cwd = webapp/)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { normalizeUmlauts } from "../lib/normalize";
import type { ImageEntry, ImageManifest } from "../lib/types";

const ROOT = join(process.cwd(), ".."); // Archiv liegt eine Ebene über webapp/
const SRC = join(ROOT, "05_Bilder_und_Medien", "Bildquellen_Index.json");
const OUT_DIR = join(process.cwd(), "data");
const OUT = join(OUT_DIR, "image-manifest.json");

interface RawImage {
  id: string;
  jahr?: string;
  thema?: string;
  dateiname?: string;
  rechte?: string;
  nutzung?: string;
  alt?: string;
}

function jahrOf(r: RawImage): number | null {
  if (r.jahr && /^\d{3,4}$/.test(r.jahr)) return Number(r.jahr);
  const m = r.id.match(/IMG_(\d{4})/);
  return m ? Number(m[1]) : null;
}

const raw = JSON.parse(readFileSync(SRC, "utf8")) as RawImage[];
const manifest: ImageManifest = {};

for (const r of raw) {
  if (!r.id) continue;
  const entry: ImageEntry = {
    bildId: r.id,
    dateiname: r.dateiname ?? "",
    alt: normalizeUmlauts(r.alt ?? ""),
    rechte: normalizeUmlauts(r.rechte ?? ""),
    nutzung: r.nutzung ?? "",
    jahr: jahrOf(r),
    thema: r.thema ?? "",
    blobUrl: null, // wird in 40_upload_blob gesetzt
    present: false, // true sobald echte Datei hochgeladen ist
  };
  manifest[r.id] = entry;
}

// Zusätzlich: echte, freigegebene Bilder aus den extrahierten Dokumenten (07_),
// kopiert nach webapp/public/bilder/. doc-images.json erzeugt die Python-Konsolidierung.
const DOC = join(OUT_DIR, "doc-images.json");
const PUB = join(process.cwd(), "public", "bilder");
if (existsSync(DOC)) {
  const docs = JSON.parse(readFileSync(DOC, "utf8")) as Array<{
    bildId: string;
    dateiname: string;
    alt: string;
    rechte: string;
    nutzung: string;
    jahr: number | null;
    thema: string;
  }>;
  for (const d of docs) {
    if (!d.bildId) continue;
    const present = existsSync(join(PUB, d.dateiname));
    manifest[d.bildId] = {
      bildId: d.bildId,
      dateiname: d.dateiname,
      alt: normalizeUmlauts(d.alt || ""),
      rechte: normalizeUmlauts(d.rechte || ""),
      nutzung: d.nutzung || "",
      jahr: d.jahr ?? null,
      thema: d.thema || "",
      blobUrl: present ? "/bilder/" + d.dateiname : null,
      present,
    };
  }
  console.log(`  + ${docs.length} Bilder aus 07_Dokumente_extrahiert`);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n", "utf8");
const present = Object.values(manifest).filter((m) => m.present).length;
console.log(`✓ image-manifest.json: ${Object.keys(manifest).length} Bilder (${present} mit Datei) → ${OUT}`);
