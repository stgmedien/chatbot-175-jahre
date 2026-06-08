// Wandelt die ASCII-Umlaut-Schreibweise (ae/oe/ue) der kuratierten Archiv-Dateien
// in echte Umlaute um – aber NUR für eine kuratierte Allowlist bekannter Begriffe.
// Ein pauschales ae→ä / oe→ö / ue→ü würde Wörter wie "aktuelle", "Duell" oder
// "individuell" zerstören; daher wird wortweise nur ersetzt, was hier gelistet ist.
// Hinweis: vorgenerierte Antworten kommen bereits als sauberes Deutsch von Claude;
// dieser Normalizer ist v. a. ein Sicherheitsnetz für Bild-Alt-Texte und Rohtext.

const MAP: Record<string, string> = {
  fuer: "für", Fuer: "Für",
  ueber: "über", Ueber: "Über",
  Schueler: "Schüler", Schuelern: "Schülern", Schuelerin: "Schülerin",
  Schuelerinnen: "Schülerinnen", Schuelerzeitung: "Schülerzeitung",
  gegruendet: "gegründet", gegruendete: "gegründete", Gruendung: "Gründung",
  Gruender: "Gründer", Gruenden: "Gründen",
  Gebaeude: "Gebäude", Gebaeudes: "Gebäudes", Gebaeuden: "Gebäuden",
  Schulgebaeude: "Schulgebäude", Schulgebaeudes: "Schulgebäudes",
  Tuermchen: "Türmchen", Tuermchenblasen: "Türmchenblasen", Tuermen: "Türmen",
  Jubilaeum: "Jubiläum", Jubilaeums: "Jubiläums", Jubilaeen: "Jubiläen",
  Schuljubilaeum: "Schuljubiläum",
  oeffentlich: "öffentlich", oeffentliches: "öffentliches", oeffentlichen: "öffentlichen",
  naechste: "nächste", naechsten: "nächsten",
  Universitaet: "Universität", Aktivitaeten: "Aktivitäten",
  Raeume: "Räume", Saele: "Säle", Faecher: "Fächer", Hoefe: "Höfe",
  spaeter: "später", waehlte: "wählte", waehrend: "während", haeufig: "häufig",
  ungefaehr: "ungefähr", fuehrte: "führte", eingefuehrt: "eingeführt",
  Maedchen: "Mädchen", jaehrige: "jährige", jaehrigen: "jährigen",
  "175-jaehrigen": "175-jährigen", "175-jaehrige": "175-jährige",
  Portraet: "Porträt", Portraets: "Porträts",
  Buehne: "Bühne", Auffuehrung: "Aufführung", Auffuehrungen: "Aufführungen",
  Gaeste: "Gäste", Saenger: "Sänger", Posaunenchoere: "Posaunenchöre",
  Feldstrasse: "Feldstraße", Strasse: "Straße", Grundsteinlegung: "Grundsteinlegung",
};

/** Ersetzt allowlistete ASCII-Umlaut-Wörter durch echte Umlaute (wortweise, sicher). */
export function normalizeUmlauts(input: string): string {
  if (!input) return input;
  return input.replace(/[A-Za-zÄÖÜäöüß0-9-]+/g, (word) => MAP[word] ?? word);
}
