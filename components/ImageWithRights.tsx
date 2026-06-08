import Image from "next/image";
import type { ImageEntry } from "@/lib/types";

/** Zeigt ein Bild aus Vercel Blob – oder einen gestylten Platzhalter, solange keine
 *  echte Datei vorhanden ist. Alt-Text + Rechtehinweis stehen immer dabei. */
export default function ImageWithRights({ img }: { img: ImageEntry }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-esg-border bg-esg-card">
      {img.present && img.blobUrl ? (
        <Image
          src={img.blobUrl}
          alt={img.alt}
          width={1200}
          height={900}
          className="h-auto w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-esg-border/40 p-4 text-center">
          <span className="text-sm text-esg-muted">
            🖼 Bild folgt{img.jahr ? ` · ${img.jahr}` : ""}
            <span className="mt-1 block text-xs">{img.alt}</span>
          </span>
        </div>
      )}
      <figcaption className="px-3 py-2 text-xs text-esg-muted">
        {img.alt} · <span className="italic">{img.rechte || "Rechte zu klären"}</span>
      </figcaption>
    </figure>
  );
}
