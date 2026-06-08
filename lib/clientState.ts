"use client";
// Persona + 18+-Bestätigung leben clientseitig in localStorage.
import { useEffect, useState } from "react";
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

/** Liest die Persona erst nach Mount (vermeidet Hydration-Mismatch). */
export function usePersona(): Persona | null {
  const [p, setP] = useState<Persona | null>(null);
  useEffect(() => setP(readPersona()), []);
  return p;
}

export function useAgeConfirmed(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(readAge()), []);
  return ok;
}
