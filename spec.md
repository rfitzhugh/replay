# Technical Specification for Replay (Prototype)

> Status: **Outline / in progress.** This document captures the technical
> specification for the Replay prototype. Sections marked _(TBD)_ record a
> decision that still needs to be made; sections without that marker reflect
> decisions already taken (see [Design Decisions](#2-design-decisions)).

## Overview

Replay is a lightweight web application that explores a tailored interaction model for AI-assisted education. Instead of generating or rewriting tests, Replay helps developers learn how experienced engineers reason about unit tests through an interactive walkthrough. 

This spec covers how the web app will be implemented as a prototype. See the [PRD](prd.md) Goals, Non-Goals, and Success Criteria. 

## High-Level Architecture

Replay is fundamentally **a walkthrough engine**, not an AI application. A walkthrough is a structured explanation of an engineering artifact. In this prototype, that artifact is a unit test.

The walkthrough engine intentionally does **not** know how walkthroughs are produced. It only knows how to present them. This separation makes the interaction reusable regardless of how semantic understanding is generated.

```
                Browser
                    │
                    ▼
         Walkthrough Engine
      ┌────────────────────────┐
      │ Code Viewer            │
      │ Timeline + Step Focus  │
      │ Focus / Coaching Panel │
      │ Fixed Step Navigation  │
      │ Review Summary         │
      └──────────┬─────────────┘
                 │
                 ▼
        Walkthrough Object
                 ▲
                 │
     Example Source   (MVP)
         LLM Source   (Optional)
```

The MVP uses curated walkthroughs from the example source.

## Separation of Concerns

Replay intentionally separates semantic reasoning from interaction.

### Walkthrough Source

Responsible for:

- understanding code (if applicable)
- identifying concepts
- producing structured walkthroughs

Examples include:

- checked-in walkthrough JSON
- cached walkthroughs
- live LLM analysis

### Walkthrough Engine

Responsible for:

- highlighting code
- sequencing explanations
- transitions
- navigation
- progressive disclosure

The engine never knows where a walkthrough originated.

### Project Structure

```text
app/
├── page.tsx                 # mounts ReplayApp
├── layout.tsx
└── globals.css              # design tokens + layout/interaction styles

components/
├── ReplayApp.tsx            # example picker + hydrate/validate + error recovery
├── WalkthroughEngine.tsx    # timeline, step focus, modes, coaching cards, keyboard
├── CodeViewer.tsx           # line highlight / reveal / hotspots / test-name cue
├── StepNavigation.tsx       # compact Prev/Next (fixed footer)
└── ReviewCard.tsx           # review summary above code

lib/walkthrough/
├── types.ts
├── schema.ts
├── validate.ts
├── normalize.ts             # arrange→act→assert→smell?→review timeline
├── examples.ts              # 3 curated examples
├── source.ts                # CuratedWalkthroughSource + hydrate
└── index.ts

tests/
├── unit/
│   ├── normalize.test.ts
│   └── validate.test.ts
├── component/
│   └── walkthrough-engine.test.tsx
└── manual-qa-checklist.md
```

## Design Decisions

### LLM Lives at the Boundary

The optional LLM integration uses a source adapter that returns a strongly typed `Walkthrough` object. 
Conceptually:

```ts
const walkthrough = await generateObject({
  model: providerModel,
  schema: WalkthroughSchema,
  prompt,
});
```

The returned object is validated immediately. From that point onward, every part of the application operates on ordinary TypeScript objects. The benefits are: 

- deterministic UI
- no manual parsing
- compile-time type safety
- simpler testing
- replaceable provider implementation

### Curated Walkthroughs First

The MVP ships with three carefully designed walkthroughs rather than requiring live LLM analysis. This is to ensure an easy getting started for users:

- immediate user experience
- deterministic behavior
- no API keys
- no latency
- no prompt iteration during the demo

The interaction, not the model, is the focus of the prototype.

### Rendering Is Part of the Product

Replay ships a custom line-based code viewer instead of Monaco or a syntax highlighter. This is because Replay is a guided reading experience not a code editor.

Owning the rendering pipeline makes it straightforward to:

- highlight current / pending / completed / upcoming lines
- dim non-active sections
- progressively reveal the current step's lines (~180ms cadence)
- mark the `it(...)` / `test(...)` name line as an orientation cue
- treat step ranges as clickable hotspots

This keeps the code as the focal interface while remaining fully deterministic.

### Animation Should Teach

Animation is used as an instructional device.

Every animation should either:

- focus attention
- communicate progression
- reinforce understanding

Decorative motion is intentionally avoided.

## Domain Model

The central abstraction is the `Walkthrough`.

```ts
interface Walkthrough {
  arrange: WalkthroughStep;
  act: WalkthroughStep;
  assert: WalkthroughStep;
  smell?: WalkthroughStep;
  review: ReviewComment;
}

interface WalkthroughInstruction {
  question: string;
  evidence: string[];       // min 1
  mentorTake: string;
  failureMode: string;
  deepDive?: string[];      // optional; min 1 if present
}

interface WalkthroughStep {
  id: string;
  kind: "arrange" | "act" | "assert" | "smell";
  explanation: string;      // used in step-focus panel above code
  instruction: WalkthroughInstruction;
  startLine: number;
  endLine: number;
  example?: SmellExample;   // required when kind === "smell"; omitted otherwise
}

interface SmellExample {
  before: string;           // brittle assertion snippet
  after: string;            // improved assertion snippet
}

interface ReviewComment {
  summary: string;          // shown above code on review
  nameCheck: string;        // naming assessment of the test title; right insight panel on review
  suggestion: string;       // one suggested improvement; right insight panel on review
}

interface WalkthroughExample {
  id: string;
  title: string;
  description: string;
  sourceCode: string;
  walkthrough: Walkthrough;
}
```

This explicit structure matches the interaction flow exactly and removes ambiguity from the UI.
Render order is fixed and deterministic: `arrange -> act -> assert -> smell? -> review`.

### Instruction field usage in UI

| Field | Focus mode | Coaching mode card |
| ----- | ---------- | ------------------ |
| `question` | Primary prompt | Card: Question |
| `evidence` | First 2 bullets as "What to notice" | Card: What to notice (all bullets) |
| `mentorTake` | — | Card: Mentor take |
| `failureMode` | — | Card: Common pitfall |
| `deepDive` | — | Optional card: Deeper context |
| step `explanation` | Step-focus panel above code | Same |
| step `example` | — | Smell-only card: before/after assertion snippets from `example.before` / `example.after` |

## Validation Rules

All walkthrough data is validated with Zod before rendering. Minimum invariants are:

- `startLine` and `endLine` are positive integers
- `startLine <= endLine`
- all referenced lines are within the source code length
- `arrange`, `act`, and `assert` are required; each step's `kind` must match its key
- `smell` is optional; if present, `kind` must be `"smell"`
- `example` is required when `kind` is `"smell"` and must have non-empty `before` and `after`; it must be absent for all other kinds
- step ids are unique within a walkthrough
- `explanation` is a required non-empty string on every step (it is the step-focus body)
- `instruction.question`, `mentorTake`, `failureMode` are required non-empty strings
- `instruction.evidence` has at least one non-empty string
- if `deepDive` is present, it has at least one non-empty string
- `review.summary`, `review.nameCheck`, and `review.suggestion` are required non-empty strings

If validation fails, the UI should show a recoverable error state and allow resetting to curated examples.

## Hydration Safety Rules

Replay uses SSR + hydration, so deterministic markup is required. UI implementation rules:

- Use valid HTML nesting (for example, do not place `div` children directly inside a `pre` element)
- Do not use non-deterministic values in render output (`Math.random()`, `Date.now()`, per-request locale/timezone formatting)
- Do not branch render output on client-only checks such as `typeof window !== "undefined"` inside SSR-rendered components
- Keep initial render derived from stable, validated walkthrough data only
- Set `suppressHydrationWarning` on root `app/layout.tsx` `<body>` to ignore extension-injected attributes (for example Grammarly)

Definition of done:

- No React hydration mismatch warnings on initial load in local development
- If a warning appears, reproduce once in an extension-disabled/incognito window before treating it as an app defect

## Curated Walkthroughs

Ship three examples (all include smell + review in the current MVP):

1. `discount-eligible-customer`
2. `order-submission-async`
3. `inventory-low-stock-notification`

Each includes source code + validated walkthrough with Socratic `instruction` content.

## Presentation Layer

### User Flow

```text
Open Replay

↓

Choose Example

↓

Interactive Walkthrough

↓

Arrange

↓

Act

↓

Assert

↓

Testing Smell (if present)

↓

Senior Engineer Review
```

Within each non-review step, users may switch Focus ↔ Coaching without changing the timeline step.

### UI Layout
Vertical composition (top → bottom):

1. **Example toolbar** — select curated example
2. **Hero** — product name `Replay`, example title, description
3. **Timeline pills** — `ARRANGE` / `ACT` / `ASSERT` / `SMELL?` / `REVIEW` (clickable)
4. **Step-focus card** (non-review) or **ReviewCard** (review)
5. **Two-column grid** — code (left) + insight column (right)
6. **Fixed footer** — compact `Prev` / `Next` step navigation (viewport-fixed)

### Step-focus card (above code)

The step-focus card poses a **fixed lens question** by step kind; the authored,
step-specific Socratic question lives in the insight column (see below). This split
is intentional: the lens orients the reader to the AAA phase, and the insight panel
asks the specific question about this test.

- Meta: `Step N of M • KIND`
- Prompt title from fixed step-kind labels:
  - arrange → “What are we setting up?”
  - act → “What behavior are we exercising?”
  - assert → “What outcome must hold true?”
  - smell → “What makes this brittle?”
- Body: `step.explanation`
- Keep a consistent panel height strategy (min-height; avoid clipping text)

### Review above code (`ReviewCard`)

- Meta: `Step M of M • REVIEW`
- Title: “Senior Engineer Review”
- Body: `review.summary` only

### Insight column (right of code)

**Non-review steps**

- Card contains centered **Focus | Coaching** toggle at top
- **Focus mode (default):**
  - Question (`instruction.question`)
  - What to notice (first 2 `evidence` bullets)
- **Coaching mode:**
  - Card-level nav (`‹` ··· `›`) under the toggle
  - Then card title + body for the active coaching card
  - Cards in order: Question → What to notice → Mentor take → Common pitfall → optional Deeper context → (smell only) Smell example

**Review step**

- Same Focus | Coaching toggle remains visible but **disabled/greyed out**
- Single guidance card with:
  - Naming check: authored judgment from `review.nameCheck` (whether the title states
    behavior, condition, and expected outcome)
  - Optional display echo of the `it`/`test` title string, read from `sourceCode` for
    orientation only — never a computed judgment
  - Suggested improvement (`review.suggestion`)

### Fixed footer navigation

- Compact pill buttons (`Prev` / `Next`), centered
- `position: fixed` bottom bar so location does not jump when insight content height changes
- Add bottom padding on the main layout so content is not obscured
- Shortcut hint: `←/→ step · 1–N jump`

## Keyboard Shortcuts

- Step nav: `←/→` or `[`/`]`
- Timeline jump: `1`–`9`
- Coaching cards: `j`/`k`
- Focus/Coaching toggle: `f` / `c`

Hotspot code lines also support Enter/Space to jump to that step.

Number keys map to the **visible** timeline index (`Step N of M`), not a fixed
kind. All three MVP examples include a smell (M = 5), so this is not exercised yet;
when smell is absent (M = 4) the engine must still keep number-key jumps aligned
with the rendered pills. Noted and deferred.

## Tech Stack

| Area              | Technology                         | Why                                              |
| ----------------- | ---------------------------------- | ------------------------------------------------ |
| Framework         | Next.js 15 (App Router)            | Full-stack React application                     |
| Language          | TypeScript                         | End-to-end type safety                           |
| Styling           | Custom CSS (`app/globals.css`)     | Deterministic layout tokens; no Tailwind runtime |
| Code Rendering    | Custom line renderer (`CodeViewer`)| Line-level highlight/dim without an editor       |
| Validation        | Zod                                | Shared runtime schemas                           |
| Unit Testing      | Vitest                             | Fast feedback                                    |
| Component Testing | React Testing Library              | Validate interaction behavior                    |

**Not used in the shipped MVP**: Tailwind, shadcn/ui, Radix, Prism, Monaco, live LLM adapters.

## Testing Strategy

This prototype prioritizes interaction quality over exhaustive test coverage and includes:

- schema validation
- walkthrough sequencing
- navigation logic
- one representative component test
- one hydration safety check (manual console verification is acceptable for MVP)
- one manual scanability check for step panel readability at laptop width

Testing should provide confidence that the walkthrough experience remains functional while avoiding unnecessary complexity.

For MVP speed, tests are run locally during development; CI remains intentionally lightweight and does not gate on tests yet.

## Out of Scope (Prototype)

This prototype intentionally does **not** include:

- Authentication
- User accounts
- Persistence
- Databases
- Multiple languages
- Multiple testing frameworks
- Test generation
- Test rewriting
- AI chat
- Editing code
- Production-scale infrastructure
- Dark mode
- Learning history
- Shareable Walkthrough URLs

# Engineering Tradeoffs

This prototype intentionally favors deterministic behavior over technical completeness.

- Curated walkthroughs instead of live LLM analysis eliminate latency and ensure users see the intended interaction
- A custom code viewer is preferred over a full editor because Replay is a reading experience, not an editing experience
- The walkthrough is modeled explicitly as Arrange -> Act -> Assert -> Smell -> Review because the product teaches one specific mental model rather than supporting arbitrary educational flows

These decisions optimize for validating the interaction while keeping implementation achievable within the project time constraints.

## Alternatives Considered

- Monaco Editor - rejected because Replay is a guided reading experience rather than a code editor; owning the rendering pipeline provides simpler implementation and greater control over the interaction
- Free-Form LLM Responses - rejected because deterministic UI is more valuable than expressive prose; structured domain objects make the interface predictable and easier to test
- Live LLM as the Primary Experience - rejected for the MVP because reviewers should experience the interaction immediately without requiring API keys, network connectivity, or dealing with model latency; the walkthrough engine is the product and live LLM analysis is simply one possible source of walkthroughs