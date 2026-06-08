// Zentrale Typen für den Erzählbot (RAG-Web-App, ESG 175-Jahr-Jubiläum).

export type ToneTier = "kind" | "erwachsene" | "fach";

/** Eine Antwort in drei Ton-Stufen (vorgeneriert + von Hand geprüft). */
export interface TieredAnswer {
  kind: string;
  erwachsene: string;
  fach: string;
}

export interface Station {
  id: string;
  frage: string;
  antwort: TieredAnswer;
  /** Bild-IDs (IMG_YYYY_NNN) → werden über das Bild-Manifest aufgelöst. */
  imageBildIds: string[];
  /** Quellenangaben, die unter der Antwort gezeigt werden. */
  citations: string[];
  /** IDs möglicher Anschluss-Stationen ("Wenn Besucher nachfragen"). */
  weiter: string[];
  /** Gate: nur reviewed === true wird ausgeliefert. */
  reviewed: boolean;
}

export interface Pfad {
  slug: string;
  titel: string;
  icon: string;
  /** Kurzer Teaser für den Hub. */
  kurz: string;
  themen: string[];
  stationen: Station[];
}

export interface FaqItem {
  id: string;
  frage: string;
  antwort: TieredAnswer;
  imageBildIds: string[];
  citations: string[];
  themen: string[];
  reviewed: boolean;
}

/** Ein Eintrag im Bild-Manifest (aus 05_Bilder_und_Medien/Bildquellen_Index.json). */
export interface ImageEntry {
  bildId: string;
  dateiname: string;
  alt: string;
  rechte: string;
  nutzung: string;
  jahr: number | null;
  thema: string;
  /** Vercel-Blob-URL; null solange keine echte Datei hochgeladen ist. */
  blobUrl: string | null;
  /** false → gestylter Platzhalter statt kaputtes <img>. */
  present: boolean;
}
export type ImageManifest = Record<string, ImageEntry>;

/** Ein Chunk des RAG-Index (liegt zur Laufzeit in Vercel Blob). */
export interface IndexChunk {
  id: string;
  text: string;
  /** Text inkl. e5-Prefix ("passage: …"), zur Reproduzierbarkeit gespeichert. */
  embedText: string;
  vector: number[];
  sourceFile: string;
  themen: string[];
  year: number | null;
  citation: string;
}
export interface EmbeddingsIndex {
  model: string;
  dim: number;
  normalized: boolean;
  builtAt: string;
  contentHash: string;
  chunks: IndexChunk[];
}

/** Server-aufgelöste Station fürs Rendering (Bilder bereits aus dem Manifest gemappt). */
export interface ViewStation {
  id: string;
  frage: string;
  antwort: TieredAnswer;
  images: ImageEntry[];
  citations: string[];
  weiter: string[];
}

// Persona (clientseitig in localStorage gehalten).
export type AgeBand = "schueler" | "18-35" | "36-60" | "60plus";
export type Role = "ehemalige" | "eltern" | "lehrkraft" | "gast";
export interface Persona {
  age: AgeBand;
  role: Role;
}
