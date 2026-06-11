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
          Willkommen beim Erzählbot des Evangelisch-Stiftischen Gymnasiums Gütersloh. Stell ihm
          deine Fragen zu 175 Jahren Schulgeschichte – er antwortet mit Quellen und historischen
          Fotos. Oder klick dich durch die geführten Pfade.
        </p>
      </div>

      <StartForm />
    </div>
  );
}
