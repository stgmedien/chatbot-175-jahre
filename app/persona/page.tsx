"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AGE_OPTIONS, ROLE_OPTIONS } from "@/lib/persona";
import type { AgeBand, Role } from "@/lib/types";
import { savePersona } from "@/lib/clientState";

function Group<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-esg-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              value === o.value
                ? "border-esg-primary bg-esg-primary text-white"
                : "border-esg-border bg-esg-card text-esg-primary hover:border-esg-primary"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function PersonaPage() {
  const router = useRouter();
  const [age, setAge] = useState<AgeBand | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  function weiter() {
    if (age && role) savePersona({ age, role });
    router.push("/hub");
  }

  return (
    <div className="flex flex-col gap-7 py-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-esg-primary">Wer bist du?</h1>
        <p className="text-esg-muted">
          So passt der Erzählbot Tonfall und Tiefe an. Du kannst das später jederzeit umstellen.
        </p>
      </div>

      <Group label="Wie alt bist du?" options={AGE_OPTIONS} value={age} onChange={setAge} />
      <Group label="Was trifft auf dich zu?" options={ROLE_OPTIONS} value={role} onChange={setRole} />

      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={weiter}
          className="rounded-full bg-esg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-esg-primary-700"
        >
          Weiter →
        </button>
        <Link href="/hub" className="text-sm text-esg-muted underline">
          überspringen
        </Link>
      </div>
    </div>
  );
}
