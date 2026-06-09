"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePersona, useAgeConfirmed, confirmAge } from "@/lib/clientState";
import { toneForPersona } from "@/lib/persona";
import { MarkdownPreview } from "./MarkdownPreview";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const BEISPIELE = [
  "Seit wann gibt es den Posaunenchor?",
  "Wann wurde das ESG gegründet?",
  "Was hat es mit dem ersten Fußballverein auf sich?",
  "Wer war Direktor in den 1930er Jahren?",
];

export default function ChatBox() {
  const persona = usePersona();
  const ageStored = useAgeConfirmed();
  const [confirmedHere, setConfirmedHere] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const allowed = ageStored || confirmedHere;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || streaming) return; // Doppel-Absende-Schutz
    setError(null);

    const history: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, tier: toneForPersona(persona), over18: true }),
        signal: controller.signal,
      });

      const ct = res.headers.get("Content-Type") ?? "";
      if (!res.ok || ct.includes("application/json")) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Es ist ein Fehler aufgetreten.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      }
      if (!acc.trim()) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: "_Dazu habe ich gerade keine Antwort. Bitte formuliere die Frage anders._",
          };
          return next;
        });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setMessages((prev) => {
          const next = [...prev];
          const lastMsg = next[next.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && !lastMsg.content.trim()) next.pop();
          return next;
        });
      } else {
        setError("Netzwerkfehler – bitte versuch es erneut.");
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput("");
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-esg-border bg-esg-card p-5">
        <p className="font-medium text-esg-primary">Eigene Fragen ab 18 Jahren</p>
        <p className="mt-1 text-sm text-esg-muted">
          Um eigene Fragen einzutippen, bestätige bitte, dass du 18 Jahre oder älter bist. Die
          geführten Pfade kannst du jederzeit ohne Bestätigung erkunden.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => {
              confirmAge();
              setConfirmedHere(true);
            }}
            className="rounded-full bg-esg-primary px-5 py-2 text-sm font-medium text-white hover:bg-esg-primary-700"
          >
            Ich bin 18 oder älter
          </button>
          <Link
            href="/hub"
            className="rounded-full border border-esg-border px-5 py-2 text-sm font-medium text-esg-primary hover:bg-background"
          >
            Zu den Pfaden
          </Link>
        </div>
      </div>
    );
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-[calc(100dvh-12rem)] flex-col">
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-esg-muted">Erzählbot</span>
        {!empty && (
          <button
            onClick={newChat}
            className="rounded-full border border-esg-border px-3 py-1 text-xs font-medium text-esg-primary hover:bg-esg-card"
          >
            Neuer Chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="max-w-sm text-esg-muted">
              Frag mich alles rund um 175 Jahre ESG – ich antworte aus dem Schularchiv und nenne die
              Quelle.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {BEISPIELE.map((b) => (
                <button
                  key={b}
                  onClick={() => send(b)}
                  className="rounded-full border border-esg-border bg-esg-card px-3 py-1.5 text-sm text-esg-primary hover:border-esg-primary"
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-esg-primary px-4 py-2.5 text-white">
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-esg-border bg-esg-card px-4 py-3">
                    {m.content ? <MarkdownPreview content={m.content} /> : <TypingDots />}
                  </div>
                </div>
              ),
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded-xl border border-esg-accent/40 bg-esg-accent/5 p-3 text-sm text-esg-accent">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-2 flex items-end gap-2 border-t border-esg-border bg-background pt-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Deine Frage…"
          rows={1}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-esg-border bg-esg-card px-4 py-2.5 outline-none focus:border-esg-primary"
        />
        {streaming ? (
          <button
            type="button"
            onClick={stop}
            className="h-11 shrink-0 rounded-full border border-esg-border px-4 text-sm font-medium text-esg-primary hover:bg-esg-card"
          >
            Stopp
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-11 shrink-0 rounded-full bg-esg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-esg-primary-700 disabled:opacity-50"
          >
            Senden
          </button>
        )}
      </form>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="schreibt…">
      <span className="size-2 animate-bounce rounded-full bg-esg-muted [animation-delay:-0.2s]" />
      <span className="size-2 animate-bounce rounded-full bg-esg-muted [animation-delay:-0.1s]" />
      <span className="size-2 animate-bounce rounded-full bg-esg-muted" />
    </span>
  );
}
