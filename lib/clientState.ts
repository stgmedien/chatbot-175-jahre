"use client";
// Persona + 18+-Bestätigung leben clientseitig in localStorage.
// Gelesen über useSyncExternalStore → hydration-sicher (Server-Snapshot = leer)
// und ohne setState-in-Effect.
import { useSyncExternalStore } from "react";
import type { Persona } from "./types";
import { STORAGE_KEY } from "./persona";

const AGE_KEY = "esg-18plus";

export function savePersona(p: Persona): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

export function readPersona(): Persona | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? (JSON.parse(v) as Persona) : null;
  } catch {
    return null;
  }
}

export function confirmAge(): void {
  try {
    localStorage.setItem(AGE_KEY, "1");
  } catch {}
}

export function readAge(): boolean {
  try {
    return localStorage.getItem(AGE_KEY) === "1";
  } catch {
    return false;
  }
}

// --- Externer Store (localStorage) für useSyncExternalStore ---

function subscribe(onChange: () => void): () => void {
  // "storage" feuert bei Änderungen aus anderen Tabs; für denselben Tab genügt
  // das Remounten bei Navigation (Persona wird auf /persona gesetzt, dann /frage).
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// getSnapshot MUSS bei unveränderten Daten denselben Wert liefern (sonst Endlos-
// Render). Booleans sind stabil; das Persona-Objekt cachen wir gegen den Rohstring.
let personaRaw: string | null | undefined;
let personaCache: Persona | null = null;

function personaSnapshot(): Persona | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {}
  if (raw !== personaRaw) {
    personaRaw = raw;
    try {
      personaCache = raw ? (JSON.parse(raw) as Persona) : null;
    } catch {
      personaCache = null;
    }
  }
  return personaCache;
}

export function usePersona(): Persona | null {
  return useSyncExternalStore(subscribe, personaSnapshot, () => null);
}

export function useAgeConfirmed(): boolean {
  return useSyncExternalStore(subscribe, readAge, () => false);
}

/** false während SSR/Hydration, danach true – für hydrationssichere Platzhalter. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
