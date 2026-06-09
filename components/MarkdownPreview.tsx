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
};

function MarkdownPreviewImpl({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-esg max-w-none">
      <ReactMarkdown remarkPlugins={remarkPlugins} skipHtml components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// XSS-sicher: skipHtml + kein rehype-raw → Model-Output kann kein HTML einschleusen.
export const MarkdownPreview = memo(MarkdownPreviewImpl);
