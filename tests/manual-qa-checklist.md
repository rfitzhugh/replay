# Replay — Manual QA Checklist

Maps to `plan.md` **Acceptance Checklist** and `spec.md` **Success Criteria** /
**UI Layout** / **Testing Strategy**. Run against the dev build (`npm run dev`)
with no API key configured.

Legend: ✅ = verified in the orchestrator's rendered-browser screenshot pass;
☐ = requires human judgment at a real laptop.

## Automated coverage (for reference)

These are covered by `npm test` and need no manual repeat:

- Timeline sequencing arrange → act → assert → smell? → review, review always
  last, 0-based contiguous indices, M=5 with smell / M=4 without —
  `tests/unit/normalize.test.ts`
- Schema + validation: all 3 curated examples validate/hydrate; line-bounds,
  kind/example coupling, duplicate ids, empty required strings, empty evidence
  all rejected with populated `issues`; unknown id throws a plain Error —
  `tests/unit/validate.test.ts`
- Interaction flow: initial ARRANGE lens, Next-through-to-REVIEW, keyboard
  arrows/brackets, Focus default, Coaching pager, toggle disabled on review,
  number-key jump to review, recoverable error UI —
  `tests/component/walkthrough-engine.test.tsx`

## Acceptance checklist (manual)

### Speed / journey

- ☐ First highlighted insight appears within 30–60s of load (open app, read the
  arrange step-focus card and its highlighted code range — no setup required).
- ☐ A full walkthrough (arrange → review) can be completed in under 2 minutes.

### Determinism & offline

- ✅ Deterministic order with smell + review — every curated example renders the
  five pills ARRANGE / ACT / ASSERT / SMELL? / REVIEW in fixed order.
  (Also locked by `normalize.test.ts`.)
- ☐ Runs with **no API key**: unset any provider env vars, reload — the three
  curated examples still load instantly with no network calls.

### Progressive disclosure

- ✅ Focus is the default insight mode; Coaching cards page through
  Question → What to notice → Mentor take → Common pitfall → (Deeper context) →
  (smell only) Smell example.
- ✅ Focus/Coaching toggle is disabled/greyed on the REVIEW step.
- ☐ Coaching pager `‹ dots ›` and `j`/`k` shortcuts move one card at a time and
  clamp at the ends (no wraparound, no blank card).

### Review composition

- ✅ Review shows the `review.summary` above the code; naming check +
  suggested improvement appear in the right insight column.
- ✅ Optional `it(...)` test-title echo shown for orientation only (not a
  computed judgment).

### Layout / footer

- ✅ Footer Prev/Next is `position: fixed`, compact, and does not jump when the
  insight card height changes between Focus and Coaching.
- ✅ Example picker is **one compact labeled dropdown**, not a multi-button tab
  row of full-sentence titles.
- ✅ Timeline pills convey current/completed/upcoming via icon + border-weight
  only — **no redundant "current" text label** duplicating the step-focus meta.
- ✅ Visible spacing gap between the step-focus / review card and the
  code+insight grid below it.

### Code viewer (rendered-browser only — jsdom cannot catch these)

- ✅ On the REVIEW step (worst case: every prior step is "completed"), status
  badges are **de-duplicated** — no stacked/repeating "✓ COMPLETED" labels where
  an overlapping range fragments into multiple DOM segments. Exactly one
  `current` badge on the active step.
- ✅ Long lines (especially the `it("...")` / `test("...")` title) **wrap**
  rather than being hard-clipped with no scroll affordance.
- ✅ Line highlighting / progressive reveal follows the active step's range.

### Robustness

- ✅ Recoverable error state: invalid walkthrough data shows the "This
  walkthrough could not load" alert with the validation issues and a
  "Reset to curated example" control. (Also locked by the component test.)
- ✅ No React hydration mismatch warnings in the console on initial load.
  (If one appears, reproduce in an extension-disabled / incognito window before
  treating it as an app defect — per spec Hydration Safety Rules.)

### Build quality

- ☐ `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all pass.

## Human-judgment checks (leave unchecked for a reviewer)

- ☐ Step-focus panel copy is scannable at typical laptop width (~1280px) — no
  awkward clipping, comfortable line length, consistent panel height.
- ☐ The experience "feels different from a static LLM explanation" — the
  interaction (highlighting, stepping, Focus↔Coaching) is doing the teaching,
  not a wall of text.
- ☐ Keyboard-only navigation is comfortable end-to-end (`←/→` or `[`/`]` steps,
  `1`–`5` jump, `j`/`k` cards, `f`/`c` toggle, Enter/Space on code hotspots).
- ☐ Color is never the sole signal for pill/line state (icons + borders present
  for accessibility).
