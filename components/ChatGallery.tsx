"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { ImageEntry } from "@/lib/types";

/** Kompakte, horizontal scrollbare Bildergalerie unter einer Chat-Antwort.
 *  Antippen öffnet eine Lightbox (große Ansicht); Alt-Text + Quelle stehen immer dabei. */
export default function ChatGallery({ images }: { images: ImageEntry[] }) {
  const [active, setActive] = useState<ImageEntry | null>(null);

  if (images.length === 0) return null;
  const single = images.length === 1;

  return (
    <>
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
            <button
              type="button"
              onClick={() => setActive(img)}
              className="block w-full cursor-zoom-in"
              aria-label={`Bild vergrößern: ${img.alt}`}
            >
              <Image
                src={img.blobUrl!}
                alt={img.alt}
                width={800}
                height={600}
                sizes="(max-width: 640px) 80vw, 320px"
                className="h-40 w-full object-cover"
              />
            </button>
            <figcaption className="px-2 py-1.5 text-[11px] leading-snug text-esg-muted">
              {img.alt}
              {img.jahr ? ` · ${img.jahr}` : ""} ·{" "}
              <span className="italic">{img.rechte || "Rechte zu klären"}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {active && <Lightbox img={active} onClose={() => setActive(null)} />}
    </>
  );
}

function Lightbox({ img, onClose }: { img: ImageEntry; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Hintergrund-Scroll sperren, solange die Lightbox offen ist.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={img.alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/85 p-4"
    >
      {/* Klick irgendwo schließt; das Bild selbst stoppt das Schließen nicht – einfacher fürs Fest */}
      <Image
        src={img.blobUrl!}
        alt={img.alt}
        width={1600}
        height={1200}
        sizes="100vw"
        className="max-h-[78dvh] w-auto max-w-full rounded-lg object-contain"
      />
      <p className="max-w-xl text-center text-sm leading-snug text-white/90">
        {img.alt}
        {img.jahr ? ` · ${img.jahr}` : ""}
        <span className="mt-0.5 block text-xs italic text-white/60">
          {img.rechte || "Rechte zu klären"}
        </span>
      </p>
      <button
        type="button"
        onClick={onClose}
        className="min-h-[44px] rounded-full border border-white/30 bg-white/10 px-6 text-sm font-medium text-white hover:bg-white/20"
      >
        Schließen ✕
      </button>
    </div>
  );
}
