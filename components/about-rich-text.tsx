import type { ReactNode } from "react";

type AboutRichTextProps = {
  text: string;
  className?: string;
  listVariant?: "default" | "compact";
};

type Block =
  | {
      type: "paragraph";
      lines: string[];
    }
  | {
      type: "ordered-list";
      items: string[];
    };

const orderedListPattern = /^\d+\.\s+/;
const boldPattern = /<(b|strong)>(.*?)<\/\1>/gi;

function parseInline(text: string) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(boldPattern)) {
    const [fullMatch, , content = ""] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    nodes.push(
      <strong key={`${start}-${content}`} className="font-semibold text-[var(--foreground)]">
        {content}
      </strong>
    );

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function parseBlocks(text: string): Block[] {
  const lines = text.split(/\r?\n/);
  const blocks: Block[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({ type: "paragraph", lines: paragraphLines });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({ type: "ordered-list", items: listItems });
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (orderedListPattern.test(line)) {
      flushParagraph();
      listItems.push(line.replace(orderedListPattern, "").trim());
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

export function AboutRichText({ text, className, listVariant = "default" }: AboutRichTextProps) {
  const blocks = parseBlocks(text);
  const isCompactList = listVariant === "compact";

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === "ordered-list") {
          return (
            <ol key={`list-${index}`} className={isCompactList ? "space-y-5" : "space-y-7"}>
              {block.items.map((item, itemIndex) => (
                <li
                  key={`item-${itemIndex}`}
                  className={isCompactList ? "grid grid-cols-[1.6rem,1fr] items-start gap-1.5" : "grid grid-cols-[2rem,1fr] items-start gap-2.5"}
                >
                  <span
                    className={
                      isCompactList
                        ? "pt-[0.42rem] text-[0.58rem] font-medium tracking-[0.16em] text-[color:color-mix(in_srgb,var(--muted-foreground-soft)_94%,var(--foreground))]"
                        : "pt-1 text-[0.6rem] font-medium tracking-[0.18em] text-[color:color-mix(in_srgb,var(--muted-foreground-soft)_94%,var(--foreground))]"
                    }
                  >
                    {String(itemIndex + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={
                      isCompactList
                        ? "text-[0.96rem] leading-7 text-[color:color-mix(in_srgb,var(--muted-foreground)_90%,var(--foreground))]"
                        : "text-[0.98rem] leading-8 text-[color:color-mix(in_srgb,var(--muted-foreground)_90%,var(--foreground))]"
                    }
                  >
                    {parseInline(item)}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p
            key={`paragraph-${index}`}
            className="max-w-[34rem] text-[0.99rem] leading-8 text-[color:color-mix(in_srgb,var(--muted-foreground)_88%,var(--foreground))]"
          >
            {parseInline(block.lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
}
