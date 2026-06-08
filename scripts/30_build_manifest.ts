// Baut data/image-manifest.json aus 05_Bilder_und_Medien/Bildquellen_Index.json.
// Real ausführbar, braucht weder API-Key noch echte Bilddateien.
//   Aufruf:  npm run build:manifest   (tsx, cwd = webapp/)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`✓ image-manifest.json: ${Object.keys(manifest).length} Bilder → ${OUT}`);
