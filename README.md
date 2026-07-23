# Replay

Replay is an interactive walkthrough that reveals the reasoning process an experienced engineer would use when reading code — starting with a unit test. Instead of generating or rewriting tests, Replay helps developers build intuition by exposing the structure, trade-offs, and design decisions hidden inside familiar testing patterns.

It walks you through a test one concept at a time along a fixed flow:

```
arrange → act → assert → smell? → review
```

At each step the code stays the focal point: the active lines highlight, a step-focus card poses the lens question, and an insight column teaches via **Focus** (dense) or **Coaching** (paginated cards) — ending in a senior-engineer review with a naming check and one suggested improvement.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Custom CSS with design tokens (`app/globals.css`) — no Tailwind/shadcn |
| Code rendering | Custom line-based `CodeViewer` — no Monaco/Prism |
| Validation | Zod |
| Tests | Vitest + React Testing Library |

The MVP is fully deterministic and curated — **no API key, no network, no live LLM required.**

## Getting started

### Prerequisites

- **Node.js 18.18+** (20 LTS or newer recommended)
- npm (ships with Node)

### Install and run

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**. Pick an example from the dropdown and step through the walkthrough.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build (run `build` first) |
| `npm test` | Run the Vitest suite once |
| `npm run typecheck` | `tsc --noEmit` type check |
| `npm run lint` | ESLint (`next lint`) |

## Keyboard shortcuts

- **Step nav:** `←` / `→` or `[` / `]`
- **Jump to step:** `1`–`9` (maps to the visible timeline index)
- **Coaching cards:** `j` / `k`
- **Focus / Coaching toggle:** `f` / `c`
- **Hotspot code lines:** `Enter` / `Space` jumps to that step

## Curated examples

Three built-in unit tests, each teaching a distinct assertion smell:

- **Discount for loyalty members** — full-object `toEqual` (over-asserts unrelated fields)
- **Async order submission** — over-specified mock-call assertion
- **Low-stock notification** — brittle exact-string match

## Project structure

```
app/                     # App Router entry, layout, global CSS
components/               # Walkthrough engine UI (CodeViewer, InsightColumn, …)
lib/walkthrough/          # Domain: types, Zod schema, validation, timeline,
                          #   curated examples, curated source
tests/                    # Unit + component tests, manual QA checklist
```

## Architecture

Replay separates **walkthrough source** from **walkthrough presentation**. A source produces validated, typed `Walkthrough` objects; the engine only knows how to present them (highlighting, sequencing, navigation, progressive disclosure). It never knows where a walkthrough came from — checked-in JSON today, a live LLM adapter later — so the interaction is reusable regardless of how the semantic understanding is generated.

Every walkthrough is validated with Zod before rendering. Invalid data surfaces a recoverable error state with a reset to curated examples, rather than crashing the UI.

## Testing

```bash
npm test
```

Covers walkthrough sequencing, schema validation, and one representative end-to-end engine flow (step navigation, keyboard jump, Focus/Coaching toggle, and recovery from invalid data). Layout-only concerns (status-badge de-duplication, line wrapping, spacing) are verified with a rendered-browser screenshot pass — see the testing notes in `spec.md`.

## Documentation

- [`prd.md`](prd.md) — product requirements, goals, success criteria
- [`spec.md`](spec.md) — technical specification (domain model, validation, UI layout)
- [`plan.md`](plan.md) — build plan, file ownership, acceptance checklist
