// Bild-Helfer für die Chat-Galerie: kompakter Katalog für den (gecachten) System-
// Block des Chatbots + Parser, der den [[BILDER: …]]-Marker vom sichtbaren Text trennt.
import manifestJson from "@/data/image-manifest.json";
import type { ImageManifest, ImageEntry } from "./types";

const IMAGES = manifestJson as ImageManifest;

/** Alle echten (hochgeladenen) Bilder – nur diese dürfen im Chat erscheinen. */
export function presentImages(): ImageEntry[] {
  return Object.values(IMAGES).filter((e) => e.present && !!e.blobUrl);
}

/**
 * Kompakter Bildkatalog als Text für den gecachten System-Block des Chatbots.
 * Format pro Zeile: `BildID | Jahr | Thema | Beschreibung`.
 */
export const IMAGE_CATALOG_TEXT: string = presentImages()
  .map((e) => `${e.bildId} | ${e.jahr ?? "?"} | ${e.thema} | ${e.alt}`)
  .join("\n");

/** Bild-IDs → present-Einträge (dedupliziert, max N) für die Chat-Galerie. */
export function resolveBildIds(ids: string[], max = 3): ImageEntry[] {
  const out: ImageEntry[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const e = IMAGES[id];
    if (e && e.present && e.blobUrl) out.push(e);
    if (out.length >= max) break;
  }
  return out;
}

// Vollständiger Marker bzw. ein am Stream-Ende noch unvollständiger Marker.
const MARKER_RE = /\[\[\s*BILDER\s*:\s*([^\]]*?)\]\]/i;
const PARTIAL_MARKER_RE = /\[\[\s*BILDER\b[^\]]*$/i;

/**
 * Trennt den BILDER-Marker vom sichtbaren Text. Während des Streamings wird ein
 * noch unvollständiger Marker am Ende verborgen (kein Aufblitzen von „[[BILDER:").
 */
export function parseBilder(content: string): { text: string; ids: string[] } {
  const m = content.match(MARKER_RE);
  if (m) {
    const ids = m[1]
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return { text: content.replace(MARKER_RE, "").trimEnd(), ids };
  }
  return { text: content.replace(PARTIAL_MARKER_RE, "").trimEnd(), ids: [] };
}
