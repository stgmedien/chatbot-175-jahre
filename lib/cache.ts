// Eigener Antwort-Cache: gleiche (normalisierte) Frage + Ton-Stufe → gespeicherte
// Antwort wiederverwenden (Wiederholfragen am Fest kosten 0 €). Vercel KV in Prod,
// In-Memory-Fallback für lokale Entwicklung ohne KV.
import { kv } from "@vercel/kv";
import { createHash } from "node:crypto";
import type { ToneTier } from "./types";

const kvEnabled = !!process.env.KV_REST_API_URL;
const mem = new Map<string, { value: unknown; expires: number }>();

// Default-TTL für gecachte Live-Antworten: 24 h. Begrenzt die Wirkung einer
// (durch Prompt-Injection) vergifteten Antwort und invalidiert automatisch.
const DEFAULT_TTL_S = 60 * 60 * 24;

// Cache-Version: an einen serverseitig kontrollierten Wert binden, damit ein
// einzelner Nutzer-Turn nicht den globalen Antwortbestand über Versionen hinweg
// bestimmt. Bei Prompt-/Wissensbasis-Änderungen hochzählen (oder per Env setzen),
// dann sind alte (ggf. vergiftete) Einträge sofort unerreichbar.
export const CACHE_VERSION = process.env.CACHE_VERSION ?? "v3";

export function answerKey(question: string, tier: ToneTier): string {
  const norm = question.trim().toLowerCase().replace(/\s+/g, " ");
  const h = createHash("sha256")
    .update(`${CACHE_VERSION}|${tier}|${norm}`)
    .digest("hex")
    .slice(0, 24);
  return `ans:${CACHE_VERSION}:${h}`;
}

export async function getCachedAnswer<T = unknown>(key: string): Promise<T | null> {
  if (kvEnabled) return ((await kv.get<T>(key)) as T) ?? null;
  const e = mem.get(key);
  if (!e) return null;
  if (e.expires <= Date.now()) {
    mem.delete(key);
    return null;
  }
  return (e.value as T) ?? null;
}

export async function setCachedAnswer(
  key: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_TTL_S,
): Promise<void> {
  if (kvEnabled) await kv.set(key, value, { ex: ttlSeconds });
  else mem.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}
