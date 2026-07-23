// The curated walkthrough source.
//
// A "source" is anything that can list and produce walkthroughs. The engine
// never knows where a walkthrough originated — it only consumes the validated,
// hydrated result. This source serves the checked-in curated examples and
// validates them on the way out, so authoring mistakes surface immediately.

import { examples } from "./examples";
import { hydrateExample } from "./validate";
import type { ExampleSummary, HydratedWalkthrough } from "./types";

/** The curated example source used by the MVP. */
export const CuratedWalkthroughSource = {
  /** Lightweight summaries for the example picker, in display order. */
  list(): ExampleSummary[] {
    return examples.map(({ id, title, description }) => ({
      id,
      title,
      description,
    }));
  },

  /**
   * Validate and hydrate the example with the given id.
   *
   * @throws {WalkthroughValidationError} if the example fails validation.
   * @throws {Error} if no example has the given id.
   */
  hydrate(id: string): HydratedWalkthrough {
    const example = examples.find((candidate) => candidate.id === id);
    if (!example) {
      throw new Error(`Unknown walkthrough example id: "${id}"`);
    }
    return hydrateExample(example);
  },
};
