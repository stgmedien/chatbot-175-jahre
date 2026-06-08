"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmAge } from "@/lib/clientState";

export default function StartForm() {
  const router = useRouter();
  const [over18, setOver18] = useState(false);

  function start() {
    if (over18) confirmAge();
    router.push("/persona");
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="flex items-start gap-3 rounded-xl border border-esg-border bg-esg-card p-4 text-sm">
        <input
          type="checkbox"
          checked={over18}
          onChange={(e) => setOver18(e.target.checked)}
          className="mt-0.5 size-5 accent-esg-primary"
        />
        <span>
          Ich bestätige, dass ich <strong>18 Jahre oder älter</strong> bin.
          <span className="block text-esg-muted">
            Nötig, um später eigene Fragen einzutippen. Die geführten Pfade kannst du auch ohne
            Bestätigung erkunden.
          </span>
        </span>
      </label>

      <button
        onClick={start}
        className="rounded-full bg-esg-primary px-6 py-3 text-center font-medium text-white transition-colors hover:bg-esg-primary-700"
      >
        Los geht’s →
      </button>
    </div>
  );
}
