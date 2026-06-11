"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePersona, useAgeConfirmed, useHydrated, confirmAge } from "@/lib/clientState";
import { toneForPersona } from "@/lib/persona";
import { parseBilder, resolveBildIds } from "@/lib/images";
import { MarkdownPreview } from "./MarkdownPreview";
import ChatGallery from "./ChatGallery";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const BEISPIELE = [
  "Seit wann gibt es den Posaunenchor?",
  "Wann wurde das ESG gegründet?",
  "Zeig mir historische Fotos vom Schulgebäude!",
  "Was hat es mit dem ersten Fußballverein auf sich?",
  "Wer war Direktor in den 1930er Jahren?",
];

// Ab so vielen Nachrichten weisen wir dezent darauf hin, dass der Bot nur die
// letzten Turns als Kontext nutzt (Server kappt auf MAX_TURNS=12).
const CONTEXT_HINT_AT = 12;
const TEXTAREA_MAX = 128; // px – deckt sich mit max-h-32

export default function ChatBox() {
  const persona = usePersona();
  const ageStored = useAgeConfirmed();
  const hydrated = useHydrated();
  const [confirmedHere, setConfirmedHere] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  // Folgt der Stream dem unteren Rand? Nur dann automatisch nachscrollen, damit
  // ein Nutzer, der hochgescrollt hat, beim Lesen nicht nach unten gerissen wird.
  const stickRef = useRef(true);

  const allowed = ageStored || confirmedHere;

  // Deep-Link ?q=… (z. B. von den Hub-Chips): Frage einmalig automatisch senden.
  // sendRef zeigt immer auf die aktuelle send-Funktion (Effect-Deps bleiben schlank).
  const sendRef = useRef<((text: string) => void) | null>(null);
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (!hydrated || !allowed || autoSentRef.current) return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q || !q.trim()) return;
    autoSentRef.current = true;
    // Param entfernen, damit ein Reload die Frage nicht erneut abschickt.
    window.history.replaceState(null, "", window.location.pathname);
    queueMicrotask(() => sendRef.current?.(q.trim().slice(0, 500)));
  }, [hydrated, allowed]);

  // Stick-to-bottom: misst direkt das Endsentinel statt Body-/Footer-Höhen.
  useEffect(() => {
    const onScroll = () => {
      const el = endRef.current;
      stickRef.current = el ? el.getBoundingClientRect().bottom <= window.innerHeight + 120 : true;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Nur nachscrollen, wenn der Nutzer unten ist. Während des Streamings ohne
  // "smooth" (sonst unterbricht jede Token-Animation die vorige → Ruckeln).
  useEffect(() => {
    if (!stickRef.current) return;
    endRef.current?.scrollIntoView({
      block: "end",
      behavior: streamingRef.current ? "auto" : "smooth",
    });
  }, [messages]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX)}px`;
  }, []);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  useEffect(() => {
    sendRef.current = send;
  });

  async function send(text: string) {
    const q = text.trim();
    if (!q || streamingRef.current) return; // Doppel-Absende-Schutz
    setError(null);
    stickRef.current = true; // eigene Nachricht immer sichtbar machen

    const history: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setStreaming(true);
    streamingRef.current = true;

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
      const paint = () =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        paint();
      }
      // Decoder leeren: ein über die letzte Chunk-Grenze gesplittetes Mehrbyte-
      // Zeichen (Umlaut!) bliebe sonst im Puffer und ginge verloren.
      const tail = decoder.decode();
      if (tail) {
        acc += tail;
        paint();
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
      streamingRef.current = false;
      abortRef.current = null;
      focusInput();
    }
  }

  function stop() {
    abortRef.current?.abort();
    focusInput();
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    focusInput();
  }

  // Bis localStorage gelesen ist: neutraler Platzhalter statt Gate/Chat (kein Flash).
  if (!hydrated) {
    return <div className="min-h-[40dvh] animate-pulse rounded-2xl border border-esg-border bg-esg-card/40" />;
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
            className="flex min-h-[44px] items-center rounded-full bg-esg-primary px-5 text-sm font-medium text-white hover:bg-esg-primary-700"
          >
            Ich bin 18 oder älter
          </button>
          <Link
            href="/hub"
            className="flex min-h-[44px] items-center rounded-full border border-esg-border px-5 text-sm font-medium text-esg-primary hover:bg-background"
          >
            Zu den Pfaden
          </Link>
        </div>
      </div>
    );
  }

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-[60dvh] flex-col">
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-esg-muted">Erzählbot</span>
        {!empty && (
          <button
            onClick={newChat}
            className="flex min-h-[44px] items-center rounded-full border border-esg-border px-3 text-xs font-medium text-esg-primary hover:bg-esg-card"
          >
            Neuer Chat
          </button>
        )}
      </div>

      {messages.length > CONTEXT_HINT_AT && (
        <p className="pb-2 text-center text-xs text-esg-muted">
          Hinweis: Der Bot bezieht sich auf die letzten Nachrichten dieses Gesprächs.
        </p>
      )}

      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
          <p className="max-w-sm text-esg-muted">
            Frag mich alles rund um 175 Jahre ESG – ich antworte aus dem Schularchiv und nenne die
            Quelle.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {BEISPIELE.map((b) => (
              <button
                key={b}
                onClick={() => send(b)}
                className="flex min-h-[44px] items-center rounded-full border border-esg-border bg-esg-card px-4 text-sm text-esg-primary hover:border-esg-primary"
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div role="log" aria-live="polite" aria-atomic="false" className="flex flex-1 flex-col gap-4 py-2">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-esg-primary px-4 py-2.5 text-white">
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-start">
                <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-esg-border bg-esg-card px-4 py-3">
                  <AssistantContent content={m.content} />
                </div>
              </div>
            ),
          )}
          <div ref={endRef} className="scroll-mb-24" />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-2 rounded-xl border border-esg-accent/40 bg-esg-accent/5 p-3 text-sm text-esg-accent"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-0 z-10 mt-2 flex items-end gap-2 border-t border-esg-border bg-background pt-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            autoResize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Deine Frage…"
          rows={1}
          aria-label="Deine Frage"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-esg-border bg-esg-card px-4 py-2.5 outline-none focus:border-esg-primary"
        />
        {streaming ? (
          <button
            type="button"
            onClick={stop}
            className="min-h-[44px] shrink-0 rounded-full border border-esg-border px-4 text-sm font-medium text-esg-primary hover:bg-esg-card"
          >
            Stopp
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="min-h-[44px] shrink-0 rounded-full bg-esg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-esg-primary-700 disabled:opacity-50"
          >
            Senden
          </button>
        )}
      </form>
    </div>
  );
}

/** Assistent-Bubble: trennt den [[BILDER: …]]-Marker vom Text, rendert Markdown +
 *  (falls passende echte Fotos genannt wurden) eine kompakte Galerie darunter. */
function AssistantContent({ content }: { content: string }) {
  const { text, ids } = parseBilder(content);
  if (!text.trim()) return <TypingDots />;
  return (
    <>
      <MarkdownPreview content={text} />
      <ChatGallery images={resolveBildIds(ids)} />
    </>
  );
}

function TypingDots() {
  return (
    <span role="status" aria-label="schreibt…" className="inline-flex gap-1 py-1">
      <span className="size-2 animate-bounce rounded-full bg-esg-muted [animation-delay:-0.2s]" />
      <span className="size-2 animate-bounce rounded-full bg-esg-muted [animation-delay:-0.1s]" />
      <span className="size-2 animate-bounce rounded-full bg-esg-muted" />
    </span>
  );
}
