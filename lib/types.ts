// Zentrale Typen für den Erzählbot (RAG-Web-App, ESG 175-Jahr-Jubiläum).

export type ToneTier = "kind" | "erwachsene" | "fach";

/** Eine Antwort in drei Ton-Stufen (vorgeneriert + von Hand geprüft). */
export interface TieredAnswer {
  kind: string;
  erwachsene: string;
  fach: string;
}

/** Eine antippbare Verzweigungs-Option: Teaser-Text + Ziel-Knoten-ID. */
export interface PathOption {
  /** Antippbarer Teaser (wird zur „User-Bubble", wenn man ihn wählt). */
  label: string;
  /** ID des Knotens, zu dem diese Option führt. */
  ziel: string;
}

/** Ein Knoten der Verzweigungskarte: kurze Antwort + bis zu 3 Weiter-Optionen. */
export interface PathNode {
  id: string;
  antwort: TieredAnswer;
  /** Bild-IDs (IMG_YYYY_NNN) → werden über das Bild-Manifest aufgelöst. */
  imageBildIds: string[];
  /** Quellenangaben, die unter der Antwort gezeigt werden. */
  citations: string[];
  /** Genau 3 bei Nicht-Terminal-Knoten; [] bei Abschluss-Knoten. */
  optionen: PathOption[];
}

/** Einstieg eines Pfads: Begrüßung + die 3 ersten Optionen (noch keine Antwort). */
export interface PathStart {
  intro: string;
  optionen: PathOption[];
}

export interface Pfad {
  slug: string;
  titel: string;
  icon: string;
  /** Kurzer Teaser für den Hub. */
  kurz: string;
  themen: string[];
  start: PathStart;
  nodes: PathNode[];
  /** Gate: nur reviewed === true wird ausgeliefert. */
  reviewed: boolean;
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

/** Server-aufgelöster Knoten fürs Rendering (Bilder bereits aus dem Manifest gemappt). */
export interface ViewNode {
  id: string;
  antwort: TieredAnswer;
  images: ImageEntry[];
  citations: string[];
  optionen: PathOption[];
}

/** Server-aufgelöster Pfad: Start + alle Knoten (Bilder gemappt) fürs Client-Rendering. */
export interface ViewPath {
  titel: string;
  intro: string;
  startOptionen: PathOption[];
  nodes: ViewNode[];
}

// Persona (clientseitig in localStorage gehalten).
export type AgeBand = "schueler" | "18-35" | "36-60" | "60plus";
export type Role = "ehemalige" | "eltern" | "lehrkraft" | "gast";
export interface Persona {
  age: AgeBand;
  role: Role;
}
