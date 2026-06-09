// Lädt die statischen, im Repo mitgelieferten Inhalte (Pfad-/FAQ-Modus = 0 API-Calls).
import pfadeJson from "@/data/paths.json";
import faqJson from "@/data/faq.json";
import manifestJson from "@/data/image-manifest.json";
import type { Pfad, FaqItem, ImageManifest, ImageEntry } from "./types";

export const PFADE = pfadeJson as Pfad[];
export const FAQ = faqJson as FaqItem[];
export const IMAGES = manifestJson as ImageManifest;

/** Nur ausgelieferte (geprüfte) Pfade mit mindestens einem Knoten. */
export function publishedPfade(): Pfad[] {
  return PFADE.filter((p) => p.reviewed && p.nodes.length > 0);
}

export function getPfad(slug: string): Pfad | null {
  return PFADE.find((p) => p.slug === slug) ?? null;
}

export function imagesFor(bildIds: string[]): ImageEntry[] {
  return bildIds.map((id) => IMAGES[id]).filter(Boolean) as ImageEntry[];
}
