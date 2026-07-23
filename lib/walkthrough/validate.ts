// Validation entry points.
//
// Validation happens in two passes:
//   1. Zod validates field shapes (types, non-empty strings, min-length arrays).
//   2. Cross-field / line-bounds invariants that Zod cannot express are checked
//      here and collected alongside the Zod issues.
// All failures are surfaced as readable strings on `WalkthroughValidationError.issues`.

import { z } from "zod";
import { WalkthroughExampleSchema } from "./schema";
import { buildTimeline } from "./normalize";
import type {
  HydratedWalkthrough,
  StepKind,
  Walkthrough,
  WalkthroughExample,
  WalkthroughStep,
} from "./types";

/** Thrown when an example fails validation. `issues` lists every detected problem. */
export class WalkthroughValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Walkthrough validation failed:\n- ${issues.join("\n- ")}`);
    this.name = "WalkthroughValidationError";
    this.issues = issues;
    // Preserve prototype chain when compiling to older targets.
    Object.setPrototypeOf(this, WalkthroughValidationError.prototype);
  }
}

/** Convert Zod issues into readable `path: message` strings. */
function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
}

/** Count the 1-indexed lines available in a source string. */
function countLines(sourceCode: string): number {
  return sourceCode.split("\n").length;
}

/**
 * Cross-field and line-bounds checks that Zod cannot express. Operates on a
 * value that has already passed the Zod schema, so field shapes are trusted.
 */
function collectSemanticIssues(example: WalkthroughExample): string[] {
  const issues: string[] = [];
  const lineCount = countLines(example.sourceCode);
  const walkthrough: Walkthrough = example.walkthrough;

  const keyedSteps: Array<{ key: StepKind; step: WalkthroughStep | undefined }> = [
    { key: "arrange", step: walkthrough.arrange },
    { key: "act", step: walkthrough.act },
    { key: "assert", step: walkthrough.assert },
    { key: "smell", step: walkthrough.smell },
  ];

  const seenIds = new Map<string, number>();

  for (const { key, step } of keyedSteps) {
    if (!step) continue;
    const where = `walkthrough.${key}`;

    // Each step's kind must match the key it is stored under.
    if (step.kind !== key) {
      issues.push(`${where}: kind "${step.kind}" must match its key "${key}"`);
    }

    // Line-range invariants.
    if (step.startLine > step.endLine) {
      issues.push(
        `${where}: startLine (${step.startLine}) must be <= endLine (${step.endLine})`
      );
    }
    if (step.endLine > lineCount) {
      issues.push(
        `${where}: endLine (${step.endLine}) exceeds sourceCode line count (${lineCount})`
      );
    }
    if (step.startLine > lineCount) {
      issues.push(
        `${where}: startLine (${step.startLine}) exceeds sourceCode line count (${lineCount})`
      );
    }

    // `example` is required for smell steps and forbidden for the others.
    if (step.kind === "smell") {
      if (!step.example) {
        issues.push(`${where}: smell step must include a before/after example`);
      }
    } else if (step.example) {
      issues.push(`${where}: example is only allowed on a smell step`);
    }

    // Unique ids within the walkthrough.
    const previousCount = seenIds.get(step.id) ?? 0;
    seenIds.set(step.id, previousCount + 1);
  }

  for (const [id, count] of seenIds) {
    if (count > 1) {
      issues.push(`walkthrough: duplicate step id "${id}" used ${count} times`);
    }
  }

  return issues;
}

/**
 * Validate an unknown value as a `WalkthroughExample`.
 *
 * Throws {@link WalkthroughValidationError} with a populated `issues` array on
 * any failure; returns the typed example on success.
 */
export function validateExample(data: unknown): WalkthroughExample {
  const parsed = WalkthroughExampleSchema.safeParse(data);

  if (!parsed.success) {
    // Shape errors block meaningful cross-field checks, so surface them alone.
    throw new WalkthroughValidationError(formatZodIssues(parsed.error));
  }

  const example = parsed.data as WalkthroughExample;
  const semanticIssues = collectSemanticIssues(example);

  if (semanticIssues.length > 0) {
    throw new WalkthroughValidationError(semanticIssues);
  }

  return example;
}

/**
 * Validate an example and build its timeline in one step.
 *
 * Throws {@link WalkthroughValidationError} on validation failure.
 */
export function hydrateExample(example: unknown): HydratedWalkthrough {
  const validated = validateExample(example);
  return {
    example: validated,
    timeline: buildTimeline(validated.walkthrough),
  };
}
