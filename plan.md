# Replay Prototype Execution Plan

This plan operationalizes `spec.md` / `prd.md` for building the Replay prototype.

Goal: ship a deterministic, polished walkthrough prototype that teaches engineering judgment through interaction — not static explanation.

## Working Model

Use one agent session as the **orchestrator** and launch subagents as workers when parallelizing.

### Roles

* **Orchestrator**: priorities, acceptance, integration, final review
* **Worker A (UI Engine)**: deterministic walkthrough UI
* **Worker B (Domain/Data)**: types, schemas, curated examples
* **Worker C (Polish/QA)**: interaction quality, error states, tests

### Core guardrail

Do **not** implement optional live LLM/source-adapter work until MVP interaction is complete, polished, and demo-safe.

## File Ownership 

Tto prevent merge conflicts

### Worker A - UI Engine

* `components/*`
* `app/page.tsx`
* `app/globals.css`

### Worker B - Domain/Data

* `lib/walkthrough/*`

### Worker C - Polish/QA

* `tests/*`
* targeted UI polish after A lands

## Build Sequence

### Phase 1: Contracts + engine skeleton (parallel)

* B: `Walkthrough` + `instruction` schema, validation, 3 curated examples
* A: viewer + timeline + step-focus + footer nav shell

### Phase 2: Integrate

* Fixed order `arrange → act → assert → smell? → review`
* Line highlighting + progressive reveal
* No API keys

### Phase 3: Progressive disclosure

* Focus / Coaching modes
* Coaching card pager + smell-example card
* Review naming check + suggestion placement

### Phase 4: Polish + confidence

* Fixed footer spacing/sizing
* Recoverable invalid-data UX
* Unit + component tests + manual QA checklist

## Orchestrator Prompt

```text
Act as orchestrator for spec.md + prd.md, following this plan.md's own File Ownership, Recommended Build Sequence, Recommended Commit Slices, and Acceptance Checklist sections as the authoritative process to follow (don't just skim — actually check off the Acceptance Checklist and commit at the slice boundaries below before declaring done)

Constraints:
- Walkthrough engine is the product
- Deterministic curated MVP; no live LLM until MVP is demo-safe
- Fixed flow: arrange -> act -> assert -> smell? -> review
- Reproduce shipped UI layout: step-focus above code, Focus/Coaching insight cards, fixed footer Prev/Next
- Schema includes WalkthroughInstruction (question, evidence, mentorTake, failureMode, optional deepDive)
- Custom CSS + custom CodeViewer (no Tailwind/shadcn/Prism required for MVP)
- Example picker is a compact dropdown; timeline pills carry no redundant "current" text label; visible spacing
  between the step-focus/review card and the code+insight grid (see spec.md "UI Layout")
- CodeViewer must de-duplicate status badges when overlapping step ranges fragment into multiple DOM segments
  (at most one badge per logical range, never one per fragment), and must wrap rather than clip long lines
  (see spec.md "Code viewer status indicators")
- Before declaring the UI done, do one rendered-browser (e.g. Playwright) screenshot pass — tsc/eslint/build/jsdom
  tests cannot catch layout-only defects like the above (see spec.md "Testing Strategy")

Launch Worker A (UI) and Worker B (domain) in parallel with strict file ownership, then Worker C for polish/tests
```

## Worker Prompts

### Worker A — UI Engine

```text
Build deterministic walkthrough UI from spec.md “UI Layout”

Must include:
- Example picker as a single compact labeled dropdown (not a multi-button toolbar of full-sentence titles)
- Timeline pills + step-focus / ReviewCard above code, with a visible spacing gap between the step-focus/review card and the grid below it
- Timeline pills convey current/completed/upcoming via icon + border-weight only — no redundant "current" text label duplicating the step-focus meta line
- CodeViewer with current/completed/upcoming states + progressive reveal
  - Resolve overlapping step line-ranges by status priority (current > completed > upcoming) per source line
  - At most one status badge visible per logical range even if overlap-resolution fragments it into multiple DOM segments - never one badge per fragment
  - Long lines (e.g. the it/test title) must wrap, never hard-clip with no way to read the rest
- Insight column with Focus/Coaching toggle (disabled on review)
- Coaching card pager (‹ dots ›) and smell-example card on smell steps
- Fixed compact Prev/Next footer
- Keyboard shortcuts per spec.md

Edit only: components/*, app/page.tsx, app/globals.css
```

### Worker B — Domain/Data

```text
Implement walkthrough domain from spec.md Domain Model

Must include:
- Types + Zod schemas with instruction object
- Validation: line bounds, unique ids, kind matching
- normalize/timeline helpers ending in review
- 3 curated examples with Socratic instruction copy
- CuratedWalkthroughSource + hydrate helper

Edit only: lib/walkthrough/*
```

### Worker C — Polish/QA

```text
Polish and QA for shipped MVP

Must include:
- Keep core Focus content visible by default
- Stable footer nav (fixed; does not jump with card height)
- Recoverable example load/validation errors
- Tests: sequencing, validation, navigation to review
- Manual QA checklist alignment with success criteria
- Mandatory rendered-browser visual pass (not just tsc/eslint/build/jsdom tests, which cannot catch layout-only bugs):
  use a real/headless browser (e.g. Playwright) to screenshot the default step, the smell step, and the review
  step (worst case for badge duplication) at a normal and a narrow (~600-900px) viewport. Confirm: no duplicated
  status badges, no clipped/hidden text, visible spacing between step-focus card and the grid, dropdown example
  picker renders correctly. Fix anything caught, don't just note it.

Edit: tests/* and targeted UI polish
```

## Recommended Commit Slices

1. Domain contract + validation (`instruction` included)
2. Curated examples
3. Core walkthrough engine UI (timeline, highlights, step nav)
4. Focus/Coaching + review panel composition
5. Layout polish (fixed footer, spacing) + tests

## Acceptance Checklist

Before declaring done:

* [ ] First highlighted insight within 30–60s of load
* [ ] Full walkthrough under 2 minutes
* [ ] Deterministic order with smell + review
* [ ] Runs with no API key
* [ ] Focus default; Coaching cards work; toggle disabled on review
* [ ] Review shows summary above code; naming + suggestion on the right
* [ ] Footer Prev/Next fixed and compact
* [ ] Recoverable error state
* [ ] No hydration warnings on initial load
* [ ] `npm test`, typecheck, lint, build pass
* [ ] Example picker is one compact dropdown, not a multi-button tab row
* [ ] Timeline pills show no redundant "current" text label (icon + border-weight only)
* [ ] Visible spacing gap between step-focus/review card and the code+insight grid
* [ ] Playwright (or equivalent) screenshot pass done on default/smell/review steps + a narrow viewport — confirms no duplicated status badges (check review step specifically) and no clipped/hidden code or copy text