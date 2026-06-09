import { notFound } from "next/navigation";
import { getPfad, publishedPfade, imagesFor } from "@/lib/data";
import type { ViewNode, ViewPath } from "@/lib/types";
import PathView from "@/components/PathView";

export function generateStaticParams() {
  return publishedPfade().map((p) => ({ slug: p.slug }));
}

export default async function PfadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pfad = getPfad(slug);
  if (!pfad || !pfad.reviewed) notFound();

  const nodes: ViewNode[] = pfad.nodes.map((n) => ({
    id: n.id,
    antwort: n.antwort,
    images: imagesFor(n.imageBildIds),
    citations: n.citations,
    optionen: n.optionen,
  }));

  const path: ViewPath = {
    titel: pfad.titel,
    intro: pfad.start.intro,
    startOptionen: pfad.start.optionen,
    nodes,
  };

  return <PathView key={pfad.slug} path={path} />;
}
