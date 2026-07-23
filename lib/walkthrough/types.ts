// Domain types for the Replay walkthrough engine.
//
// These interfaces are the public contract the UI codes against. The walkthrough
// engine consumes typed `Walkthrough` objects only, regardless of whether they
// originated from curated examples, cache, or an LLM source.

/** The four authorable step kinds. Render order is fixed: arrange → act → assert → smell?. */
export type StepKind = "arrange" | "act" | "assert" | "smell";

/** Socratic coaching content attached to a single walkthrough step. */
export interface WalkthroughInstruction {
  /** Socratic prompt that asks the reader to reason, not a statement of fact. */
  question: string;
  /** Concrete "what to notice" bullets grounded in the source lines. At least one, all non-empty. */
  evidence: string[];
  /** Senior-engineer perspective on this step. */
  mentorTake: string;
  /** The common pitfall a less experienced reader falls into here. */
  failureMode: string;
  /** Optional deeper context. If present, at least one non-empty bullet. */
  deepDive?: string[];
}

/** Before/after assertion snippets shown only in the smell coaching card. */
export interface SmellExample {
  /** Brittle assertion snippet (standalone, not a slice of sourceCode). */
  before: string;
  /** Improved assertion snippet (standalone, not a slice of sourceCode). */
  after: string;
}

/** One phase of the Arrange → Act → Assert → Smell walkthrough. */
export interface WalkthroughStep {
  /** Unique id within a walkthrough. */
  id: string;
  /** Which phase this step represents. Must equal the object key it is stored under. */
  kind: StepKind;
  /** Step-focus body shown above the code. Required, non-empty. */
  explanation: string;
  /** Socratic coaching content. */
  instruction: WalkthroughInstruction;
  /** 1-indexed first source line this step owns. */
  startLine: number;
  /** 1-indexed last source line this step owns. `>= startLine`, within source line count. */
  endLine: number;
  /** Required iff `kind === "smell"`; absent for all other kinds. */
  example?: SmellExample;
}

/** Senior-engineer review shown after the AAA steps. */
export interface ReviewComment {
  /** Overall summary shown above the code on the review step. */
  summary: string;
  /** Judgment on whether the test title states behavior, condition, and expected outcome. */
  nameCheck: string;
  /** One concrete suggested improvement. */
  suggestion: string;
}

/** The central abstraction: a structured explanation of one unit test. */
export interface Walkthrough {
  arrange: WalkthroughStep;
  act: WalkthroughStep;
  assert: WalkthroughStep;
  smell?: WalkthroughStep;
  review: ReviewComment;
}

/** A curated example: source code plus its fully-authored walkthrough. */
export interface WalkthroughExample {
  id: string;
  title: string;
  description: string;
  /** Multi-line source; step start/endLine are 1-indexed line numbers into this. */
  sourceCode: string;
  walkthrough: Walkthrough;
}

/** Human-readable label for a timeline entry. */
export type TimelineLabel = "ARRANGE" | "ACT" | "ASSERT" | "SMELL?" | "REVIEW";

/**
 * A unified ordered timeline entry. The timeline is always ordered
 * arrange → act → assert → smell? → review and ALWAYS ends with review.
 */
export type TimelineEntry =
  | { kind: StepKind; label: TimelineLabel; index: number; step: WalkthroughStep }
  | { kind: "review"; label: "REVIEW"; index: number; review: ReviewComment };

/** A validated example paired with its computed timeline. */
export interface HydratedWalkthrough {
  example: WalkthroughExample;
  timeline: TimelineEntry[];
}

/** Lightweight example descriptor for the picker toolbar. */
export interface ExampleSummary {
  id: string;
  title: string;
  description: string;
}
