import AskBox from "@/components/AskBox";

export default function FragePage() {
  return (
    <div className="flex flex-col gap-5 py-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-esg-primary">Frag den Erzählbot</h1>
        <p className="text-esg-muted">
          Stell deine Frage rund um 175 Jahre ESG – ich antworte aus dem Schularchiv und nenne die
          Quelle.
        </p>
      </header>
      <AskBox />
    </div>
  );
}
