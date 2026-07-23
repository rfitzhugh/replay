// Sequencing tests for `buildTimeline`.
//
// The engine presents steps in a fixed, deterministic order:
//   arrange -> act -> assert -> smell? -> review
// and the timeline ALWAYS ends with the review entry. These tests pin that
// contract, the 0-based contiguous indexing, and the smell-present / smell-absent
// lengths.

import { describe, it, expect } from "vitest";
import {
  buildTimeline,
  CuratedWalkthroughSource,
  type TimelineEntry,
  type TimelineLabel,
  type Walkthrough,
  type WalkthroughStep,
} from "@/lib/walkthrough";

/** Build a minimal, schema-shaped step for constructing timelines directly. */
function makeStep(
  id: string,
  kind: WalkthroughStep["kind"],
  overrides: Partial<WalkthroughStep> = {}
): WalkthroughStep {
  return {
    id,
    kind,
    explanation: `explanation for ${kind}`,
    instruction: {
      question: `question for ${kind}?`,
      evidence: [`evidence for ${kind}`],
      mentorTake: `mentor take for ${kind}`,
      failureMode: `failure mode for ${kind}`,
    },
    startLine: 1,
    endLine: 1,
    ...overrides,
  };
}

const EXPECTED_ORDER: TimelineLabel[] = [
  "ARRANGE",
  "ACT",
  "ASSERT",
  "SMELL?",
  "REVIEW",
];

/** Narrow a timeline entry to a step entry (everything but the review entry). */
function isStepEntry(
  entry: TimelineEntry
): entry is Extract<TimelineEntry, { step: WalkthroughStep }> {
  return entry.kind !== "review";
}

describe("buildTimeline sequencing", () => {
  it("orders a smell-present walkthrough arrange -> act -> assert -> smell? -> review", () => {
    // Every curated MVP example ships a smell, so M = 5.
    const { timeline } = CuratedWalkthroughSource.hydrate(
      "discount-eligible-customer"
    );

    expect(timeline).toHaveLength(5);
    expect(timeline.map((entry) => entry.label)).toEqual(EXPECTED_ORDER);
  });

  it("always terminates with the review entry", () => {
    const { timeline } = CuratedWalkthroughSource.hydrate(
      "discount-eligible-customer"
    );

    const last = timeline[timeline.length - 1];
    expect(last.kind).toBe("review");
    expect(last.label).toBe("REVIEW");
    // The review entry carries `review`, not `step`.
    if (last.kind === "review") {
      expect(last.review.summary.length).toBeGreaterThan(0);
    } else {
      throw new Error("last entry should be the review entry");
    }
  });

  it("stamps 0-based, contiguous indices that match array position", () => {
    const { timeline } = CuratedWalkthroughSource.hydrate(
      "order-submission-async"
    );

    timeline.forEach((entry, arrayPosition) => {
      expect(entry.index).toBe(arrayPosition);
    });
  });

  it("carries `.step` on every non-review entry and `.review` on the last", () => {
    const { timeline } = CuratedWalkthroughSource.hydrate(
      "inventory-low-stock-notification"
    );

    const stepEntries = timeline.filter(isStepEntry);
    expect(stepEntries).toHaveLength(4); // arrange, act, assert, smell
    for (const entry of stepEntries) {
      expect(entry.step.id.length).toBeGreaterThan(0);
      expect(entry.kind).toBe(entry.step.kind);
    }
  });

  it("produces a length-4 timeline ending in review when smell is absent", () => {
    // A smell-less Walkthrough is a legal shape (smell is optional). We build one
    // directly rather than mutating a curated example, since all curated MVP
    // examples include a smell (M = 5) and the number-key jump / M=4 path is
    // otherwise unexercised.
    const walkthrough: Walkthrough = {
      arrange: makeStep("a", "arrange"),
      act: makeStep("b", "act"),
      assert: makeStep("c", "assert"),
      review: {
        summary: "overall summary",
        nameCheck: "naming judgment",
        suggestion: "one improvement",
      },
    };

    const timeline = buildTimeline(walkthrough);

    expect(timeline).toHaveLength(4);
    expect(timeline.map((entry) => entry.label)).toEqual([
      "ARRANGE",
      "ACT",
      "ASSERT",
      "REVIEW",
    ]);
    expect(timeline[timeline.length - 1].kind).toBe("review");
    timeline.forEach((entry, i) => expect(entry.index).toBe(i));
  });
});
