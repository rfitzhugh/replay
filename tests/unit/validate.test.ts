// Schema / validation tests.
//
// Confirms all curated examples validate + hydrate, and that each documented
// invariant (line bounds, kind/example coupling, unique ids, non-empty required
// strings, non-empty evidence) throws a `WalkthroughValidationError` with a
// populated `issues` array. Also pins that an unknown id throws a plain Error,
// NOT a WalkthroughValidationError.

import { describe, it, expect } from "vitest";
import {
  CuratedWalkthroughSource,
  WalkthroughValidationError,
  examples,
  hydrateExample,
  validateExample,
  type WalkthroughExample,
} from "@/lib/walkthrough";

/** A fresh, deeply-mutable copy of the first curated example. */
function cloneValidExample(): WalkthroughExample {
  return structuredClone(examples[0]);
}

/** Run `validateExample` and return the thrown WalkthroughValidationError. */
function expectValidationError(data: unknown): WalkthroughValidationError {
  try {
    validateExample(data);
  } catch (error) {
    expect(error).toBeInstanceOf(WalkthroughValidationError);
    const validationError = error as WalkthroughValidationError;
    expect(validationError.issues.length).toBeGreaterThan(0);
    return validationError;
  }
  throw new Error("expected validateExample to throw, but it did not");
}

describe("curated examples", () => {
  it("exposes three examples via list() and the examples array", () => {
    expect(examples).toHaveLength(3);
    expect(CuratedWalkthroughSource.list()).toHaveLength(3);
    expect(CuratedWalkthroughSource.list().map((s) => s.id)).toEqual(
      examples.map((e) => e.id)
    );
  });

  it("validates and hydrates every curated example", () => {
    for (const example of examples) {
      expect(() => validateExample(example)).not.toThrow();

      const hydrated = CuratedWalkthroughSource.hydrate(example.id);
      expect(hydrated.example.id).toBe(example.id);
      // Every curated example ships a smell, so the timeline is length 5.
      expect(hydrated.timeline).toHaveLength(5);
    }
  });
});

describe("validateExample rejects invalid input", () => {
  it("rejects an endLine beyond the source length", () => {
    const bad = cloneValidExample();
    const lineCount = bad.sourceCode.split("\n").length;
    bad.walkthrough.assert.endLine = lineCount + 50;

    const error = expectValidationError(bad);
    expect(error.issues.join("\n")).toMatch(/endLine/);
  });

  it("rejects startLine greater than endLine", () => {
    const bad = cloneValidExample();
    bad.walkthrough.act.startLine = 5;
    bad.walkthrough.act.endLine = 2;

    const error = expectValidationError(bad);
    expect(error.issues.join("\n")).toMatch(/startLine/);
  });

  it("rejects a smell step missing its example", () => {
    const bad = cloneValidExample();
    if (!bad.walkthrough.smell) {
      throw new Error("fixture invariant: example 0 must have a smell step");
    }
    bad.walkthrough.smell.example = undefined;

    const error = expectValidationError(bad);
    expect(error.issues.join("\n")).toMatch(/smell step must include/i);
  });

  it("rejects an example present on a non-smell step", () => {
    const bad = cloneValidExample();
    bad.walkthrough.arrange.example = { before: "x", after: "y" };

    const error = expectValidationError(bad);
    expect(error.issues.join("\n")).toMatch(/example is only allowed on a smell step/i);
  });

  it("rejects duplicate step ids within a walkthrough", () => {
    const bad = cloneValidExample();
    bad.walkthrough.act.id = bad.walkthrough.arrange.id;

    const error = expectValidationError(bad);
    expect(error.issues.join("\n")).toMatch(/duplicate step id/i);
  });

  it("rejects an empty required string (instruction.question)", () => {
    const bad = cloneValidExample();
    bad.walkthrough.arrange.instruction.question = "   ";

    const error = expectValidationError(bad);
    expect(error.issues.join("\n")).toMatch(/question/);
  });

  it("rejects an empty evidence array", () => {
    const bad = cloneValidExample();
    bad.walkthrough.arrange.instruction.evidence = [];

    const error = expectValidationError(bad);
    expect(error.issues.join("\n")).toMatch(/evidence/);
  });

  it("collects multiple issues at once", () => {
    const bad = cloneValidExample();
    bad.walkthrough.act.startLine = 9;
    bad.walkthrough.act.endLine = 3;
    bad.walkthrough.assert.id = bad.walkthrough.arrange.id;

    const error = expectValidationError(bad);
    expect(error.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("hydrateExample throws WalkthroughValidationError on invalid data", () => {
    const bad = cloneValidExample();
    bad.walkthrough.assert.startLine = 999;
    bad.walkthrough.assert.endLine = 1000;

    expect(() => hydrateExample(bad)).toThrow(WalkthroughValidationError);
  });
});

describe("CuratedWalkthroughSource.hydrate with an unknown id", () => {
  it("throws a plain Error, not a WalkthroughValidationError", () => {
    expect(() => CuratedWalkthroughSource.hydrate("does-not-exist")).toThrow(
      /Unknown walkthrough example id/
    );

    try {
      CuratedWalkthroughSource.hydrate("does-not-exist");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(WalkthroughValidationError);
      return;
    }
    throw new Error("expected hydrate to throw for an unknown id");
  });
});
