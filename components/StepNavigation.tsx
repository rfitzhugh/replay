"use client";

interface StepNavigationProps {
  currentIndex: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function StepNavigation({
  currentIndex,
  totalSteps,
  onPrev,
  onNext,
}: StepNavigationProps) {
  const atStart = currentIndex === 0;
  const atEnd = currentIndex === totalSteps - 1;

  return (
    <footer className="step-nav" aria-label="Step navigation">
      <div className="step-nav__inner">
        <button
          type="button"
          className="nav-btn"
          onClick={onPrev}
          disabled={atStart}
        >
          <span aria-hidden="true">←</span> Prev
        </button>
        <p className="step-nav__hint">
          <kbd>←</kbd>/<kbd>→</kbd> step <span aria-hidden="true">·</span>{" "}
          <kbd>1</kbd>–<kbd>{totalSteps}</kbd> jump
        </p>
        <button
          type="button"
          className="nav-btn"
          onClick={onNext}
          disabled={atEnd}
        >
          Next <span aria-hidden="true">→</span>
        </button>
      </div>
    </footer>
  );
}
