import type { NextRequest } from "next/server";
import Anthropic, { APIUserAbortError } from "@anthropic-ai/sdk";
import { checkRateLimit, checkDailyCap } from "@/lib/ratelimit";
import { answerKey, getCachedAnswer, setCachedAnswer } from "@/lib/cache";
import { SYSTEM_PROMPT, WISSENSBASIS } from "@/lib/prompt";
import { suffixForTier } from "@/lib/persona";
import type { ToneTier } from "@/lib/types";

export const runtime = "nodejs"; // @anthropic-ai/sdk + node:crypto brauchen Node
export const maxDuration = 60; // LLM-Streams: Plattform-Timeout anheben

const TIERS: ToneTier[] = ["kind", "erwachsene", "fach"];
const MAX_TURNS = 12; // Kontext-Schutz: letzte N Nachrichten behalten

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client) client = new Anthropic(); // liest ANTHROPIC_API_KEY aus der Umgebung
  return client;
}

/** Einen kompletten Text-String als Stream-Response zurückgeben (z. B. Cache-Hit). */
function textStreamFromString(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(req: NextRequest) {
  let body: { messages?: unknown; tier?: string; over18?: boolean } | null = null;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  // --- Historie validieren + sanitisieren ---
  const raw = Array.isArray(body?.messages) ? (body!.messages as ChatMessage[]) : null;
  if (!raw || raw.length === 0) {
    return Response.json({ error: "Bitte gib eine Frage ein." }, { status: 400 });
  }
  const history: ChatMessage[] = raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.toString().slice(0, 2000) }))
    .slice(-MAX_TURNS);

  const last = history[history.length - 1];
  if (!last || last.role !== "user") {
    return Response.json({ error: "Bitte gib eine Frage ein." }, { status: 400 });
  }
  last.content = last.content.trim().slice(0, 500);
  if (!last.content) {
    return Response.json({ error: "Bitte gib eine Frage ein." }, { status: 400 });
  }

  // --- 1) 18+-Gate (serverseitig abgesichert) ---
  if (body?.over18 !== true) {
    return Response.json(
      { error: "Bitte bestätige zuerst, dass du 18 Jahre oder älter bist." },
      { status: 403 },
    );
  }

  const tier: ToneTier = TIERS.includes(body?.tier as ToneTier)
    ? (body!.tier as ToneTier)
    : "erwachsene";

  // --- 2) Antwort-Cache NUR für die erste Frage (keine Historie) ---
  const isFirstTurn = history.length === 1;
  const cacheKey = isFirstTurn ? answerKey(last.content, tier) : null;
  if (cacheKey) {
    const cached = await getCachedAnswer<{ antwort: string }>(cacheKey);
    if (cached?.antwort) return textStreamFromString(cached.antwort);
  }

  // --- 3) Rate-Limit pro IP ---
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const rl = await checkRateLimit(ip);
  if (!rl.ok) {
    return Response.json(
      { error: "Zu viele Fragen in kurzer Zeit. Bitte später erneut versuchen." },
      { status: 429 },
    );
  }

  // --- 4) Globaler Tages-Deckel ---
  const cap = await checkDailyCap();
  if (!cap.ok) {
    return Response.json(
      {
        error: "Heute wurden schon sehr viele Fragen gestellt – schau gern die geführten Pfade an!",
        capped: true,
      },
      { status: 503 },
    );
  }

  // --- 5) API-Key ---
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Die Live-Antwort ist gerade nicht verfügbar (kein API-Key konfiguriert)." },
      { status: 503 },
    );
  }

  // --- 6) Persona-Stil als Suffix am LETZTEN User-Turn ---
  const apiMessages: Anthropic.MessageParam[] = history.map((m, i) =>
    i === history.length - 1
      ? {
          role: "user" as const,
          content: `Frage einer Besucherin/eines Besuchers: ${m.content}\n\n[Stil: ${suffixForTier(tier)}]`,
        }
      : { role: m.role, content: m.content },
  );

  const encoder = new TextEncoder();
  let full = "";

  const llm = anthropic().messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    system: [
      { type: "text", text: SYSTEM_PROMPT },
      {
        type: "text",
        text: "ESG-WISSENSBASIS (nur diese Informationen verwenden):\n\n" + WISSENSBASIS,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: apiMessages,
  });

  req.signal.addEventListener("abort", () => llm.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of llm) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
        if (cacheKey && full.trim()) {
          await setCachedAnswer(cacheKey, { antwort: full.trim(), quellen: [] });
        }
      } catch (err) {
        if (err instanceof APIUserAbortError) {
          controller.close();
          return;
        }
        try {
          controller.enqueue(
            encoder.encode("\n\n_(Verbindung unterbrochen – bitte erneut versuchen.)_"),
          );
        } catch {}
        controller.close();
      }
    },
    cancel() {
      llm.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
