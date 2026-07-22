"use client";

import type { TimelineEntry } from "@/lib/walkthrough";

interface TimelinePillsProps {
  timeline: TimelineEntry[];
  currentIndex: number;
  onJumpToStep: (index: number) => void;
}

type PillState = "completed" | "current" | "upcoming";

// Icon paired with border-weight and label so state is never conveyed by color
// alone. No redundant "current" text — the phase label is the pill's content.
const PILL_ICON: Record<PillState, string> = {
  completed: "✓",
  current: "●",
  upcoming: "○",
};

export default function TimelinePills({
  timeline,
  currentIndex,
  onJumpToStep,
}: TimelinePillsProps) {
  return (
    <nav className="timeline" aria-label="Walkthrough steps">
      <ol className="timeline__pills">
        {timeline.map((entry) => {
          const state: PillState =
            entry.index === currentIndex
              ? "current"
              : entry.index < currentIndex
                ? "completed"
                : "upcoming";

          return (
            <li key={entry.label} className="timeline__item">
              <button
                type="button"
                className={`pill pill--${state}`}
                aria-current={state === "current" ? "step" : undefined}
                onClick={() => onJumpToStep(entry.index)}
              >
                <span className="pill__icon" aria-hidden="true">
                  {PILL_ICON[state]}
                </span>
                <span className="pill__label">{entry.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
