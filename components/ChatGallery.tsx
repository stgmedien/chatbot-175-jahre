import Image from "next/image";
import type { ImageEntry } from "@/lib/types";

/** Kompakte, horizontal scrollbare Bildergalerie unter einer Chat-Antwort.
 *  Zeigt nur echte Fotos (present); Alt-Text + Quelle stehen immer dabei. */
export default function ChatGallery({ images }: { images: ImageEntry[] }) {
  if (images.length === 0) return null;
  const single = images.length === 1;
  return (
    <div
      className="mt-3 flex gap-3 overflow-x-auto pb-1"
      role="group"
      aria-label="Passende Bilder aus dem Schularchiv"
    >
      {images.map((img) => (
        <figure
          key={img.bildId}
          className={`shrink-0 overflow-hidden rounded-xl border border-esg-border bg-background ${
            single ? "w-full" : "w-52"
          }`}
        >
          <Image
            src={img.blobUrl!}
            alt={img.alt}
            width={800}
            height={600}
            sizes="(max-width: 640px) 80vw, 320px"
            className="h-40 w-full object-cover"
          />
          <figcaption className="px-2 py-1.5 text-[11px] leading-snug text-esg-muted">
            {img.alt}
            {img.jahr ? ` · ${img.jahr}` : ""} ·{" "}
            <span className="italic">{img.rechte || "Rechte zu klären"}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
