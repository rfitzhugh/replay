"use client";

import type { ReviewComment, TimelineEntry } from "@/lib/walkthrough";
import type { CoachingCard } from "./insight-cards";

export type InsightMode = "focus" | "coaching";

interface InsightColumnProps {
  entry: TimelineEntry;
  mode: InsightMode;
  onModeChange: (mode: InsightMode) => void;
  cards: CoachingCard[];
  coachingIndex: number;
  onCoachingIndexChange: (index: number) => void;
  testTitle: string | null;
}

export default function InsightColumn({
  entry,
  mode,
  onModeChange,
  cards,
  coachingIndex,
  onCoachingIndexChange,
  testTitle,
}: InsightColumnProps) {
  const isReview = entry.kind === "review";

  return (
    <aside className="insight" aria-label="Insight panel">
      <ModeToggle mode={mode} onModeChange={onModeChange} disabled={isReview} />

      {entry.kind === "review" ? (
        <ReviewInsight review={entry.review} testTitle={testTitle} />
      ) : mode === "focus" ? (
        <FocusPanel
          question={entry.step.instruction.question}
          evidence={entry.step.instruction.evidence}
        />
      ) : (
        <CoachingPanel
          cards={cards}
          activeIndex={coachingIndex}
          onChange={onCoachingIndexChange}
        />
      )}
    </aside>
  );
}

interface ModeToggleProps {
  mode: InsightMode;
  onModeChange: (mode: InsightMode) => void;
  disabled: boolean;
}

function ModeToggle({ mode, onModeChange, disabled }: ModeToggleProps) {
  return (
    <div
      className="mode-toggle"
      role="group"
      aria-label="Insight display mode"
    >
      <button
        type="button"
        className={`mode-toggle__btn ${mode === "focus" ? "is-active" : ""}`}
        aria-pressed={mode === "focus"}
        disabled={disabled}
        onClick={() => onModeChange("focus")}
      >
        Focus
      </button>
      <button
        type="button"
        className={`mode-toggle__btn ${mode === "coaching" ? "is-active" : ""}`}
        aria-pressed={mode === "coaching"}
        disabled={disabled}
        onClick={() => onModeChange("coaching")}
      >
        Coaching
      </button>
    </div>
  );
}

interface FocusPanelProps {
  question: string;
  evidence: string[];
}

function FocusPanel({ question, evidence }: FocusPanelProps) {
  const notice = evidence.slice(0, 2);
  return (
    <div className="insight__body">
      <div className="insight-block">
        <p className="insight-block__eyebrow">Question</p>
        <p className="insight-block__lead">{question}</p>
      </div>
      <div className="insight-block">
        <p className="insight-block__eyebrow">What to notice</p>
        <ul className="insight-list">
          {notice.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface CoachingPanelProps {
  cards: CoachingCard[];
  activeIndex: number;
  onChange: (index: number) => void;
}

function CoachingPanel({ cards, activeIndex, onChange }: CoachingPanelProps) {
  const safeIndex = Math.min(Math.max(activeIndex, 0), cards.length - 1);
  const card = cards[safeIndex];

  return (
    <div className="insight__body">
      <div className="pager" role="group" aria-label="Coaching cards">
        <button
          type="button"
          className="pager__arrow"
          aria-label="Previous card"
          disabled={safeIndex === 0}
          onClick={() => onChange(safeIndex - 1)}
        >
          ‹
        </button>
        <span className="pager__dots" aria-hidden="true">
          {cards.map((c, i) => (
            <span
              key={c.id}
              className={`pager__dot ${i === safeIndex ? "is-active" : ""}`}
            />
          ))}
        </span>
        <span className="pager__count">
          {safeIndex + 1} / {cards.length}
        </span>
        <button
          type="button"
          className="pager__arrow"
          aria-label="Next card"
          disabled={safeIndex === cards.length - 1}
          onClick={() => onChange(safeIndex + 1)}
        >
          ›
        </button>
      </div>

      <div className="insight-block insight-block--card">
        <p className="insight-block__eyebrow">{card.title}</p>
        <CoachingCardBody card={card} />
      </div>
    </div>
  );
}

function CoachingCardBody({ card }: { card: CoachingCard }) {
  if (card.kind === "list" && card.items) {
    return (
      <ul className="insight-list">
        {card.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }

  if (card.kind === "smell") {
    return (
      <div className="smell-example">
        <div className="smell-example__col smell-example__col--before">
          <p className="smell-example__label">
            <span aria-hidden="true">⚠</span> Brittle
          </p>
          <code className="smell-example__snippet">{card.before}</code>
        </div>
        <div className="smell-example__col smell-example__col--after">
          <p className="smell-example__label">
            <span aria-hidden="true">✓</span> Improved
          </p>
          <code className="smell-example__snippet">{card.after}</code>
        </div>
      </div>
    );
  }

  return <p className="insight-block__text">{card.body}</p>;
}

interface ReviewInsightProps {
  review: ReviewComment;
  testTitle: string | null;
}

function ReviewInsight({ review, testTitle }: ReviewInsightProps) {
  return (
    <div className="insight__body">
      <div className="insight-block">
        <p className="insight-block__eyebrow">Naming check</p>
        <p className="insight-block__text">{review.nameCheck}</p>
      </div>
      {testTitle ? (
        <div className="insight-block">
          <p className="insight-block__eyebrow">Test title</p>
          <code className="insight__title-echo">{testTitle}</code>
        </div>
      ) : null}
      <div className="insight-block">
        <p className="insight-block__eyebrow">Suggested improvement</p>
        <p className="insight-block__text">{review.suggestion}</p>
      </div>
    </div>
  );
}
