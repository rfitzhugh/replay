import type { ReactNode } from "react";

/**
 * Render curated walkthrough prose that may contain single-backtick inline
 * code spans (e.g. `toEqual`, `notifier.send`) as real <code> elements.
 *
 * This is intentionally NOT a markdown parser — it only recognises inline code,
 * the one bit of formatting the curated copy uses. The input is deterministic
 * authored data, so the output is stable and hydration-safe.
 */
const INLINE_CODE = /`([^`]+)`/g;

export function renderRichText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  // Reset because the regex is module-level and stateful with the /g flag.
  INLINE_CODE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = INLINE_CODE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <code key={`code-${key++}`} className="inline-code">
        {match[1]}
      </code>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/** Inline element that formats backtick spans in `text` as <code>. */
export default function RichText({ text }: { text: string }) {
  return <>{renderRichText(text)}</>;
}
