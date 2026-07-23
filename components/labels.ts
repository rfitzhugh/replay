import type { StepKind } from "@/lib/walkthrough";

/**
 * Fixed "lens" question shown in the step-focus card above the code.
 * This is intentionally NOT the authored Socratic question (that lives in the
 * insight column); the lens orients the reader to the AAA phase.
 */
export const LENS_QUESTIONS: Record<StepKind, string> = {
  arrange: "What are we setting up?",
  act: "What behavior are we exercising?",
  assert: "What outcome must hold true?",
  smell: "What makes this brittle?",
};

/**
 * Extract the display string of the first `it(...)` / `test(...)` title in the
 * source. Used only as an orientation echo on the review step — never a
 * computed judgment. Deterministic (no locale / time), so hydration-safe.
 */
export function extractTestTitle(sourceCode: string): string | null {
  const lines = sourceCode.split("\n");
  for (const line of lines) {
    const match = line.match(/\b(?:it|test)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/);
    if (match) {
      return match[2];
    }
  }
  return null;
}
