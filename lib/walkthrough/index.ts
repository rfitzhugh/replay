// Public surface of the walkthrough engine's domain layer.
//
// The UI codes exclusively against these re-exports; nothing else under
// `lib/walkthrough/` is considered public.

export type {
  StepKind,
  WalkthroughInstruction,
  SmellExample,
  WalkthroughStep,
  ReviewComment,
  Walkthrough,
  WalkthroughExample,
  TimelineLabel,
  TimelineEntry,
  HydratedWalkthrough,
  ExampleSummary,
} from "./types";

export { buildTimeline } from "./normalize";

export {
  WalkthroughValidationError,
  validateExample,
  hydrateExample,
} from "./validate";

export { CuratedWalkthroughSource } from "./source";

export { examples } from "./examples";
