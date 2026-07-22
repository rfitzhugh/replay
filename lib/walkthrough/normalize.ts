// Timeline construction.
//
// The engine presents steps in a fixed, deterministic order:
//   arrange → act → assert → smell? → review
// and the timeline ALWAYS ends with a review entry. `buildTimeline` flattens a
// `Walkthrough` into that ordered, index-stamped list.

import type { StepKind, TimelineEntry, TimelineLabel, Walkthrough } from "./types";

const STEP_LABELS: Record<StepKind, TimelineLabel> = {
  arrange: "ARRANGE",
  act: "ACT",
  assert: "ASSERT",
  smell: "SMELL?",
};

/**
 * Flatten a walkthrough into its fixed-order timeline.
 *
 * The result is 0-based index-stamped and always terminates with the review
 * entry. Assumes the walkthrough has already been validated; the smell step is
 * included only when present.
 */
export function buildTimeline(walkthrough: Walkthrough): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  const orderedSteps = [
    walkthrough.arrange,
    walkthrough.act,
    walkthrough.assert,
    ...(walkthrough.smell ? [walkthrough.smell] : []),
  ];

  for (const step of orderedSteps) {
    entries.push({
      kind: step.kind,
      label: STEP_LABELS[step.kind],
      index: entries.length,
      step,
    });
  }

  entries.push({
    kind: "review",
    label: "REVIEW",
    index: entries.length,
    review: walkthrough.review,
  });

  return entries;
}
