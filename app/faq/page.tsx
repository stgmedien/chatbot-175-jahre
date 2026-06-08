import { FAQ, imagesFor } from "@/lib/data";
import FaqList, { type ViewFaq } from "@/components/FaqList";

export default function FaqPage() {
  const items: ViewFaq[] = FAQ.filter((f) => f.reviewed).map((f) => ({
    id: f.id,
    frage: f.frage,
    antwort: f.antwort,
    images: imagesFor(f.imageBildIds),
    citations: f.citations,
  }));

  return (
    <div className="flex flex-col gap-5 py-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-esg-primary">Häufige Fragen</h1>
        <p className="text-esg-muted">
          Die wichtigsten Fragen rund um 175 Jahre ESG – tipp eine Frage an, um die Antwort zu
          öffnen.
        </p>
      </header>
      <FaqList items={items} />
    </div>
  );
}
