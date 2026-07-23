"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HydratedWalkthrough, TimelineEntry } from "@/lib/walkthrough";
import CodeViewer from "./CodeViewer";
import InsightColumn, { type InsightMode } from "./InsightColumn";
import ReviewCard from "./ReviewCard";
import StepFocusCard from "./StepFocusCard";
import StepNavigation from "./StepNavigation";
import TimelinePills from "./TimelinePills";
import { buildCoachingCards, type CoachingCard } from "./insight-cards";
import { extractTestTitle } from "./labels";

interface WalkthroughEngineProps {
  hydrated: HydratedWalkthrough;
}

function isStepEntry(
  entry: TimelineEntry
): entry is Extract<TimelineEntry, { kind: "arrange" | "act" | "assert" | "smell" }> {
  return entry.kind !== "review";
}

export default function WalkthroughEngine({ hydrated }: WalkthroughEngineProps) {
  const { example, timeline } = hydrated;
  const total = timeline.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<InsightMode>("focus");
  const [coachingIndex, setCoachingIndex] = useState(0);

  const entry = timeline[currentIndex];

  const testTitle = useMemo(
    () => extractTestTitle(example.sourceCode),
    [example.sourceCode]
  );

  const cards: CoachingCard[] = useMemo(
    () => (isStepEntry(entry) ? buildCoachingCards(entry.step) : []),
    [entry]
  );

  // Reset the coaching pager whenever the active step changes.
  useEffect(() => {
    setCoachingIndex(0);
  }, [currentIndex]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(() => Math.min(Math.max(index, 0), total - 1));
    },
    [total]
  );

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard shortcuts. Re-registered when bounds/mode change so handlers see
  // fresh coaching-card counts.
  useEffect(() => {
    const cardCount = cards.length;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
        case "]":
          event.preventDefault();
          goNext();
          return;
        case "ArrowLeft":
        case "[":
          event.preventDefault();
          goPrev();
          return;
        case "j":
          if (cardCount > 0) {
            event.preventDefault();
            setCoachingIndex((i) => Math.min(i + 1, cardCount - 1));
          }
          return;
        case "k":
          if (cardCount > 0) {
            event.preventDefault();
            setCoachingIndex((i) => Math.max(i - 1, 0));
          }
          return;
        case "f":
          if (entry.kind !== "review") {
            event.preventDefault();
            setMode("focus");
          }
          return;
        case "c":
          if (entry.kind !== "review") {
            event.preventDefault();
            setMode("coaching");
          }
          return;
        default:
          break;
      }

      // Timeline jump: 1..9 maps to the visible timeline index.
      if (/^[1-9]$/.test(event.key)) {
        const jumpIndex = Number(event.key) - 1;
        if (jumpIndex < total) {
          event.preventDefault();
          goTo(jumpIndex);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cards.length, entry.kind, goNext, goPrev, goTo, total]);

  return (
    <div className="engine">
      <TimelinePills
        timeline={timeline}
        currentIndex={currentIndex}
        onJumpToStep={goTo}
      />

      {isStepEntry(entry) ? (
        <StepFocusCard
          step={entry.step}
          stepNumber={currentIndex + 1}
          totalSteps={total}
        />
      ) : (
        <ReviewCard
          review={entry.review}
          stepNumber={currentIndex + 1}
          totalSteps={total}
        />
      )}

      <div className="engine__gap" aria-hidden="true" />

      <div className="engine__grid">
        <CodeViewer
          sourceCode={example.sourceCode}
          timeline={timeline}
          currentIndex={currentIndex}
          onJumpToStep={goTo}
        />
        <InsightColumn
          entry={entry}
          mode={mode}
          onModeChange={setMode}
          cards={cards}
          coachingIndex={coachingIndex}
          onCoachingIndexChange={setCoachingIndex}
          testTitle={testTitle}
        />
      </div>

      <StepNavigation
        currentIndex={currentIndex}
        totalSteps={total}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}
