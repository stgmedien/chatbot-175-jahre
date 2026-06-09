import type { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, checkDailyCap, clientIp } from "@/lib/ratelimit";
import { answerKey, getCachedAnswer, setCachedAnswer } from "@/lib/cache";
import { SYSTEM_PROMPT, WISSENSBASIS } from "@/lib/prompt";
import { parseBilder } from "@/lib/images";
import { suffixForTier } from "@/lib/persona";
import type { ToneTier } from "@/lib/types";

interface AskAnswer {
  antwort: string;
  quellen: string[];
}

const TIERS: ToneTier[] = ["kind", "erwachsene", "fach"];

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client) client = new Anthropic(); // liest ANTHROPIC_API_KEY aus der Umgebung
  return client;
}

export async function POST(req: NextRequest) {
  let body: { frage?: string; tier?: string; over18?: boolean } | null = null;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const frage = (body?.frage ?? "").toString().trim().slice(0, 500);
  if (!frage) return Response.json({ error: "Bitte gib eine Frage ein." }, { status: 400 });

  // 18+-Gate (clientseitig vorgeschaltet, hier serverseitig abgesichert).
  if (body?.over18 !== true) {
    return Response.json(
      { error: "Bitte bestätige zuerst, dass du 18 Jahre oder älter bist." },
      { status: 403 },
    );
  }

  const tier: ToneTier = TIERS.includes(body?.tier as ToneTier)
    ? (body!.tier as ToneTier)
    : "erwachsene";

  // Antwort-Cache: gleiche Frage + Ton-Stufe → 0 Tokens.
  const key = answerKey(frage, tier);
  const cached = await getCachedAnswer<AskAnswer>(key);
  if (cached) return Response.json({ ...cached, cached: true });

  // API-Key zuerst: ohne Key kostet die Anfrage 0 Token und darf keine Zähler verbrauchen.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Die Live-Antwort ist gerade nicht verfügbar (kein API-Key konfiguriert)." },
      { status: 503 },
    );
  }

  // Rate-Limit + globaler Tages-Deckel (Budget-Schutz). Vertrauenswürdige Client-IP.
  const rl = await checkRateLimit(clientIp(req));
  if (!rl.ok) {
    return Response.json(
      { error: "Zu viele Fragen in kurzer Zeit. Bitte später erneut versuchen." },
      { status: 429 },
    );
  }
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

  try {
    const msg = await anthropic().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: [
        { type: "text", text: SYSTEM_PROMPT },
        {
          type: "text",
          text: "ESG-WISSENSBASIS (nur diese Informationen verwenden):\n\n" + WISSENSBASIS,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Frage einer Besucherin/eines Besuchers: ${frage}\n\n[Stil: ${suffixForTier(tier)}]`,
        },
      ],
    });

    const block = msg.content.find((b) => b.type === "text");
    // Diese Fallback-Route rendert keine Galerie → BILDER-Marker entfernen.
    const antwort = block && block.type === "text" ? parseBilder(block.text).text.trim() : "";
    const answer: AskAnswer = { antwort, quellen: [] };

    if (antwort) await setCachedAnswer(key, answer);
    return Response.json({ ...answer, cached: false });
  } catch {
    return Response.json(
      { error: "Entschuldige, gerade kann ich nicht antworten. Bitte versuch es gleich noch einmal." },
      { status: 502 },
    );
  }
}
