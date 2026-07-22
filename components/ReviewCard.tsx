"use client";

import type { ReviewComment } from "@/lib/walkthrough";

interface ReviewCardProps {
  review: ReviewComment;
  stepNumber: number;
  totalSteps: number;
}

export default function ReviewCard({
  review,
  stepNumber,
  totalSteps,
}: ReviewCardProps) {
  return (
    <section className="focus-card focus-card--review" aria-label="Senior engineer review">
      <p className="focus-card__meta">
        Step {stepNumber} of {totalSteps}
        <span className="focus-card__meta-sep" aria-hidden="true">
          •
        </span>
        <span className="focus-card__kind">REVIEW</span>
      </p>
      <h2 className="focus-card__lens">Senior Engineer Review</h2>
      <p className="focus-card__body">{review.summary}</p>
    </section>
  );
}
