import StartForm from "@/components/StartForm";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-esg-accent">
          Jubiläum 2026
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-esg-primary sm:text-4xl">
          175 Jahre ESG –<br />
          1000 Fenster, unendlich viele Geschichten
        </h1>
        <p className="max-w-prose text-lg text-esg-muted">
          Willkommen beim Erzählbot des Evangelisch-Stiftischen Gymnasiums Gütersloh. Klick dich
          durch die Geschichte unserer Schule – oder stell uns einfach deine eigene Frage.
        </p>
      </div>

      <StartForm />
    </div>
  );
}
