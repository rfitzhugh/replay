"use client";

import type { WalkthroughStep } from "@/lib/walkthrough";
import { LENS_QUESTIONS } from "./labels";

interface StepFocusCardProps {
  step: WalkthroughStep;
  stepNumber: number;
  totalSteps: number;
}

export default function StepFocusCard({
  step,
  stepNumber,
  totalSteps,
}: StepFocusCardProps) {
  return (
    <section className="focus-card" aria-label="Step focus">
      <p className="focus-card__meta">
        Step {stepNumber} of {totalSteps}
        <span className="focus-card__meta-sep" aria-hidden="true">
          •
        </span>
        <span className="focus-card__kind">{step.kind.toUpperCase()}</span>
      </p>
      <h2 className="focus-card__lens">{LENS_QUESTIONS[step.kind]}</h2>
      <p className="focus-card__body">{step.explanation}</p>
    </section>
  );
}
