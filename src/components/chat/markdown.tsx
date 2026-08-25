import { Fragment, type ReactNode } from "react";

/**
 * Lightweight Markdown renderer for Ask WebLens AI responses.
 * Supports: headings, bold, inline code, bullet/numbered lists, paragraphs.
 * No external deps — keeps the chat bundle small and styling consistent.
 */

interface MarkdownProps {
  content: string;
  className?: string;
}

function renderInline(text: string, keyBase: string): ReactNode[] {
  // Tokenize **bold**, `code`, and plain text in a single pass.
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return tokens.map((token, i) => {
    const key = `${keyBase}-t${i}`;
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={key}>{token}</Fragment>;
  });
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "paragraph"; text: string };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Skip blank lines between blocks.
    if (line.trim() === "") {
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    // Unordered list: -, *, or + followed by a space.
    const ulMatch = line.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      const items: string[] = [ulMatch[1]];
      i++;
      while (i < lines.length) {
        const m = lines[i].match(/^[-*+]\s+(.*)$/);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list: digits then . or )
    const olMatch = line.match(/^\d+[.)]\s+(.*)$/);
    if (olMatch) {
      const items: string[] = [olMatch[1]];
      i++;
      while (i < lines.length) {
        const m = lines[i].match(/^\d+[.)]\s+(.*)$/);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Paragraph: gather consecutive non-empty, non-special lines.
    const text: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (
        next.trim() === "" ||
        /^#{1,6}\s+/.test(next) ||
        /^[-*+]\s+/.test(next) ||
        /^\d+[.)]\s+/.test(next)
      ) {
        break;
      }
      text.push(next);
      i++;
    }
    blocks.push({ type: "paragraph", text: text.join(" ") });
  }

  return blocks;
}

const headingClass = (level: number) => {
  const base = "font-display font-semibold text-foreground mt-3 first:mt-0";
  switch (level) {
    case 1:
      return `${base} text-lg`;
    case 2:
      return `${base} text-base`;
    case 3:
      return `${base} text-sm`;
    default:
      return `${base} text-sm`;
  }
};

export function Markdown({ content, className }: MarkdownProps) {
  const blocks = parseBlocks(content);
  return (
    <div className={className}>
      {blocks.map((block, idx) => {
        const key = `b${idx}`;
        switch (block.type) {
          case "heading":
            const H = `h${Math.min(block.level, 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
            return (
              <H key={key} className={headingClass(block.level)}>
                {renderInline(block.text, key)}
              </H>
            );
          case "ul":
            return (
              <ul key={key} className="mt-1 list-disc space-y-1 pl-5">
                {block.items.map((item, j) => (
                  <li key={`${key}-li${j}`}>{renderInline(item, `${key}-li${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="mt-1 list-decimal space-y-1 pl-5">
                {block.items.map((item, j) => (
                  <li key={`${key}-li${j}`}>{renderInline(item, `${key}-li${j}`)}</li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={key} className="leading-relaxed">
                {renderInline(block.text, key)}
              </p>
            );
        }
      })}
    </div>
  );
}
