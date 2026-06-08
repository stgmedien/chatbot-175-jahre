// Eigener Antwort-Cache: gleiche (normalisierte) Frage + Ton-Stufe → gespeicherte
// Antwort wiederverwenden (Wiederholfragen am Fest kosten 0 €). Vercel KV in Prod,
// In-Memory-Fallback für lokale Entwicklung ohne KV.
import { kv } from "@vercel/kv";
import { createHash } from "node:crypto";
import type { ToneTier } from "./types";

const kvEnabled = !!process.env.KV_REST_API_URL;
const mem = new Map<string, unknown>();

export function answerKey(question: string, tier: ToneTier): string {
  const norm = question.trim().toLowerCase().replace(/\s+/g, " ");
  const h = createHash("sha256").update(`${tier}|${norm}`).digest("hex").slice(0, 24);
  return `ans:${h}`;
}

export async function getCachedAnswer<T = unknown>(key: string): Promise<T | null> {
  if (kvEnabled) return ((await kv.get<T>(key)) as T) ?? null;
  return (mem.get(key) as T) ?? null;
}

export async function setCachedAnswer(key: string, value: unknown): Promise<void> {
  if (kvEnabled) await kv.set(key, value);
  else mem.set(key, value);
}
