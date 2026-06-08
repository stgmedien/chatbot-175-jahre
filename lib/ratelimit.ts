// Rate-Limit pro IP + globaler Tages-Deckel als Budget-Circuit-Breaker.
// Vercel KV in Prod, In-Memory-Fallback lokal.
import { kv } from "@vercel/kv";

const kvEnabled = !!process.env.KV_REST_API_URL;
const mem = new Map<string, { count: number; reset: number }>();

const WINDOW_S = 60 * 60; // 1 Stunde
const MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_PER_HOUR ?? "20");
const DAILY_CAP = Number(process.env.DAILY_ASK_CAP ?? "1500");

function memHit(key: string, windowS: number, max: number) {
  const now = Date.now();
  const e = mem.get(key);
  if (!e || e.reset < now) {
    mem.set(key, { count: 1, reset: now + windowS * 1000 });
    return { count: 1, ok: 1 <= max };
  }
  e.count++;
  return { count: e.count, ok: e.count <= max };
}

export async function checkRateLimit(ip: string): Promise<{ ok: boolean; remaining: number }> {
  const key = `rl:${ip}`;
  if (kvEnabled) {
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, WINDOW_S);
    return { ok: count <= MAX_PER_WINDOW, remaining: Math.max(0, MAX_PER_WINDOW - count) };
  }
  const r = memHit(key, WINDOW_S, MAX_PER_WINDOW);
  return { ok: r.ok, remaining: Math.max(0, MAX_PER_WINDOW - r.count) };
}

/** Globaler Tages-Deckel: schützt das 30-€-Budget. Bei Überschreitung → Pfad-Touren. */
export async function checkDailyCap(): Promise<{ ok: boolean; used: number; cap: number }> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `cap:${day}`;
  if (kvEnabled) {
    const used = await kv.incr(key);
    if (used === 1) await kv.expire(key, 60 * 60 * 26);
    return { ok: used <= DAILY_CAP, used, cap: DAILY_CAP };
  }
  const r = memHit(key, 60 * 60 * 26, DAILY_CAP);
  return { ok: r.ok, used: r.count, cap: DAILY_CAP };
}
