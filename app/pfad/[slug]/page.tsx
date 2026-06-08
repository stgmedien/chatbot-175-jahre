import { notFound } from "next/navigation";
import { PFADE, getPfad, imagesFor } from "@/lib/data";
import type { ViewStation } from "@/lib/types";
import PathView from "@/components/PathView";

export function generateStaticParams() {
  return PFADE.map((p) => ({ slug: p.slug }));
}

export default async function PfadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pfad = getPfad(slug);
  if (!pfad) notFound();

  const stations: ViewStation[] = pfad.stationen
    .filter((s) => s.reviewed)
    .map((s) => ({
      id: s.id,
      frage: s.frage,
      antwort: s.antwort,
      images: imagesFor(s.imageBildIds),
      citations: s.citations,
      weiter: s.weiter,
    }));

  return <PathView key={pfad.slug} titel={pfad.titel} stations={stations} />;
}
