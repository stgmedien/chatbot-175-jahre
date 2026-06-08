import type { ToneTier, ViewStation } from "@/lib/types";
import ImageWithRights from "./ImageWithRights";

export default function StationCard({
  station,
  tier,
}: {
  station: ViewStation;
  tier: ToneTier;
}) {
  return (
    <article
      id={station.id}
      className="scroll-mt-20 rounded-2xl border border-esg-border bg-esg-card p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-esg-primary">{station.frage}</h2>
      <p className="mt-2 whitespace-pre-line leading-relaxed">{station.antwort[tier]}</p>

      {station.images.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {station.images.map((img) => (
            <ImageWithRights key={img.bildId} img={img} />
          ))}
        </div>
      )}

      {station.citations.length > 0 && (
        <p className="mt-3 text-xs text-esg-muted">Quelle: {station.citations.join(", ")}</p>
      )}
    </article>
  );
}
