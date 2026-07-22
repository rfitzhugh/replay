// Zod schemas mirroring the domain types in `types.ts`.
//
// These schemas cover the field-shape invariants Zod can express directly
// (types, non-empty strings, min-length arrays, kind literals). Cross-field
// and line-bounds invariants that Zod cannot express are enforced separately
// in `validate.ts`.

import { z } from "zod";

/** A string that must contain at least one non-whitespace character. */
const nonEmptyString = z.string().trim().min(1, "must be a non-empty string");

/** An array of non-empty strings with at least one element. */
const nonEmptyStringArray = z
  .array(nonEmptyString)
  .min(1, "must contain at least one non-empty string");

export const StepKindSchema = z.enum(["arrange", "act", "assert", "smell"]);

export const WalkthroughInstructionSchema = z
  .object({
    question: nonEmptyString,
    evidence: nonEmptyStringArray,
    mentorTake: nonEmptyString,
    failureMode: nonEmptyString,
    deepDive: nonEmptyStringArray.optional(),
  })
  .strict();

export const SmellExampleSchema = z
  .object({
    before: nonEmptyString,
    after: nonEmptyString,
  })
  .strict();

export const WalkthroughStepSchema = z
  .object({
    id: nonEmptyString,
    kind: StepKindSchema,
    explanation: nonEmptyString,
    instruction: WalkthroughInstructionSchema,
    startLine: z.number().int().positive(),
    endLine: z.number().int().positive(),
    example: SmellExampleSchema.optional(),
  })
  .strict();

export const ReviewCommentSchema = z
  .object({
    summary: nonEmptyString,
    nameCheck: nonEmptyString,
    suggestion: nonEmptyString,
  })
  .strict();

export const WalkthroughSchema = z
  .object({
    arrange: WalkthroughStepSchema,
    act: WalkthroughStepSchema,
    assert: WalkthroughStepSchema,
    smell: WalkthroughStepSchema.optional(),
    review: ReviewCommentSchema,
  })
  .strict();

export const WalkthroughExampleSchema = z
  .object({
    id: nonEmptyString,
    title: nonEmptyString,
    description: nonEmptyString,
    sourceCode: nonEmptyString,
    walkthrough: WalkthroughSchema,
  })
  .strict();
