import { PFADE, FAQ, IMAGES } from "@/lib/data";
import { WISSENSBASIS } from "@/lib/prompt";

export async function GET() {
  return Response.json({
    ok: true,
    phase: 1,
    pfade: PFADE.length,
    faq: FAQ.length,
    bilder: Object.keys(IMAGES).length,
    wissensbasisTokens: Math.round(WISSENSBASIS.length / 4),
    liveKonfiguriert: !!process.env.ANTHROPIC_API_KEY,
    modell: "claude-sonnet-4-6",
  });
}
