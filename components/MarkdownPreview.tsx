"use client";
import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Stabile Modul-Konstanten (NICHT inline) → memo greift beim Streaming.
const remarkPlugins = [remarkGfm];

const components: Components = {
  a({ href, children, ...props }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow" {...props}>
        {children}
      </a>
    );
  },
  // Breite Tabellen horizontal scrollbar machen, damit sie die Chat-Bubble nicht sprengen.
  table({ children, ...props }) {
    return (
      <div className="overflow-x-auto">
        <table {...props}>{children}</table>
      </div>
    );
  },
};

function MarkdownPreviewImpl({ content }: { content: string }) {
  return (
    // break-words verhindert, dass lange URLs/unumbrechbare Strings die Bubble aufblähen.
    <div className="prose prose-sm prose-esg max-w-none break-words [overflow-wrap:anywhere]">
      <ReactMarkdown remarkPlugins={remarkPlugins} skipHtml components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// XSS-sicher: skipHtml + kein rehype-raw → Model-Output kann kein HTML einschleusen.
export const MarkdownPreview = memo(MarkdownPreviewImpl);
