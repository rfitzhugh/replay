import type { TimelineEntry, WalkthroughStep } from "@/lib/walkthrough";

export type LineStatus = "current" | "completed" | "upcoming" | "idle";

export interface RenderLine {
  /** 1-indexed line number into the source. */
  number: number;
  text: string;
  status: LineStatus;
  /**
   * True only for the single first line of the current range. Used so the
   * "current" badge renders EXACTLY ONCE, never once per fragmented segment.
   */
  isCurrentBadgeAnchor: boolean;
  /** Ordinal of this line among the current-step lines (0-based) for progressive reveal; -1 if not current. */
  currentOrder: number;
  /** Timeline index to jump to when this line (a hotspot) is activated; null if not a hotspot. */
  hotspotIndex: number | null;
  /** True when the line declares the test via it(...) / test(...). */
  isTestName: boolean;
}

interface StepRange {
  index: number;
  startLine: number;
  endLine: number;
}

function isStepEntry(
  entry: TimelineEntry
): entry is Extract<TimelineEntry, { step: WalkthroughStep }> {
  return entry.kind !== "review";
}

const TEST_NAME_PATTERN = /\b(?:it|test)\s*\(/;

/**
 * Resolve every source line to a single status for the active step.
 *
 * Ranges overlap (a `smell` range often spans the whole test), so each line is
 * resolved by priority: current > completed > upcoming > idle. A line is
 * `completed` if it belongs to any step BEFORE the active one, `upcoming` if it
 * belongs only to steps AFTER it. Per-line resolution can fragment one logical
 * range into several DOM segments — the badge-anchor flag below guarantees the
 * `current` badge is emitted once, and completed/upcoming intentionally carry
 * NO floating badge (border + tint only).
 */
export function computeRenderLines(
  sourceCode: string,
  timeline: TimelineEntry[],
  currentIndex: number
): RenderLine[] {
  const textLines = sourceCode.split("\n");

  const ranges: StepRange[] = timeline.filter(isStepEntry).map((entry) => ({
    index: entry.index,
    startLine: entry.step.startLine,
    endLine: entry.step.endLine,
  }));

  const activeRange = ranges.find((range) => range.index === currentIndex) ?? null;

  let firstCurrentSeen = false;
  let currentCounter = 0;

  return textLines.map((text, i) => {
    const lineNumber = i + 1;

    const containing = ranges.filter(
      (range) => lineNumber >= range.startLine && lineNumber <= range.endLine
    );

    const inCurrent =
      activeRange !== null &&
      lineNumber >= activeRange.startLine &&
      lineNumber <= activeRange.endLine;
    const inCompleted = containing.some((range) => range.index < currentIndex);
    const inUpcoming = containing.some((range) => range.index > currentIndex);

    let status: LineStatus = "idle";
    if (inCurrent) {
      status = "current";
    } else if (inCompleted) {
      status = "completed";
    } else if (inUpcoming) {
      status = "upcoming";
    }

    let isCurrentBadgeAnchor = false;
    let currentOrder = -1;
    if (status === "current") {
      currentOrder = currentCounter;
      currentCounter += 1;
      if (!firstCurrentSeen) {
        isCurrentBadgeAnchor = true;
        firstCurrentSeen = true;
      }
    }

    // Hotspot target: narrowest range containing the line (so specific
    // arrange/act/assert ranges win over a wide smell range); earliest on ties.
    let hotspotIndex: number | null = null;
    if (containing.length > 0) {
      let best = containing[0];
      for (const range of containing) {
        const bestSpan = best.endLine - best.startLine;
        const span = range.endLine - range.startLine;
        if (span < bestSpan || (span === bestSpan && range.index < best.index)) {
          best = range;
        }
      }
      hotspotIndex = best.index;
    }

    return {
      number: lineNumber,
      text,
      status,
      isCurrentBadgeAnchor,
      currentOrder,
      hotspotIndex,
      isTestName: TEST_NAME_PATTERN.test(text),
    } satisfies RenderLine;
  });
}

/** Count of lines in the active step's range (for the reveal animation length). */
export function countCurrentLines(lines: RenderLine[]): number {
  return lines.reduce((n, line) => (line.status === "current" ? n + 1 : n), 0);
}
