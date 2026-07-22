# PRD for Replay (interactive engineering mentor)

## Problem Statement

AI coding agents can generate unit tests quickly. While this improves productivity, it compresses the traditional learning loop where engineers develop intuition by writing tests, debugging failures, receiving code review feedback, and iteratively improving design. As a result, developers can produce passing tests without understanding why those tests are robust or fragile.

## Product Thesis

AI is accelerating code generation faster than it is accelerating engineering judgment. Replay explores whether interactive explanations can help rebuild the intuition that was traditionally developed through apprenticeship and code review by helping developers understand _how experienced engineers_ read tests, rather than simply generating or explaining code. 

## Prototype Overview

The prototype of Replay is an interactive learning experience that helps engineers understand how experienced engineers reason about tests, not just what tests do. Instead of generating or rewriting tests, Replay guides users through a unit test one concept at a time, surfacing subtle trade-offs that are usually learned through code review and experience.

This prototype is intentionally scoped for one polished, self-contained experience and is intended to validate one focused interaction: a deterministic, interactive walkthrough that reveals reasoning, trade-offs, and review-level judgment.

### Goals

The prototype should demonstrate that interaction can communicate engineering reasoning more effectively than static explanation. Specifically, users should be able to:

- Understand the high-level structure of a unit test
- Identify Arrange, Act, Assert (AAA)
- Recognize one common testing smell
- Understand why that smell matters
- Experience progressive, interactive explanation anchored in code (Focus vs Coaching)
- Leave with a concise senior-review takeaway (naming + one improvement)

### Non-Goals

This prototype is **not** intended to:

- Generate tests
- Rewrite tests
- Replace code review
- Teach every testing concept
- Support every testing framework
- Provide a chat interface
- Become production-ready

The goal is to validate one high-quality interaction pattern.

### Target User

Primary audience:

- Engineers learning automated testing
- Developers using AI-generated tests
- Engineers onboarding to unfamiliar codebases

## User Journey (MVP)

### 1. Choose a Curated Example

The user selects one of three built-in unit test examples from the toolbar. Selecting an example immediately hydrates a validated walkthrough.

No setup or API key is required. 

### 2. Interactive Walkthrough

Replay progressively guides the user through a fixed timeline:

`arrange → act → assert → smell? → review`

Layout stays anchored on the code:

- Timeline pills show progress and allow jump navigation
- A step-focus card above the code asks the current lens question and shows the step explanation
- The code viewer highlights active lines with progressive reveal
- An insight column to the right teaches via **Focus** (default, dense) or **Coaching** (paginated cards)
- Compact **Prev** / **Next** controls stay fixed at the bottom of the viewport

#### Within each non-review step

- **Focus**: Socratic question + first evidence bullets (quick scan)
- **Coaching**: card pager for question → evidence → mentor take → common pitfall → optional deeper context → (on smell) concrete before/after smell example

Users can switch Focus ↔ Coaching without changing timeline position.

#### Review step

- Senior summary appears above the code
- Right panel shows a naming check on the test title plus one suggested improvement
- Focus / Coaching toggle remains visible but disabled

Keyboard support: step nav with ←/→ (or [/]), jump with 1–9, coaching cards with j/k.

## Functional Requirements

### Input

- Provide three built-in example tests for MVP
- (Stretch) Allow pasting JavaScript/TypeScript tests

### Walkthrough Source

- For MVP, walkthroughs come from curated deterministic example data
- Each walkthrough must conform to the typed domain model and validation schema, including Socratic `instruction` fields on every step
- (Stretch) Live LLM-backed analysis may produce walkthroughs through a source adapter

### Presentation

The frontend should:

- Keep code as the focal interface (step-focus above code; insight to the right)
- Highlight relevant code lines by step with progressive reveal
- Synchronize explanation and coaching with highlighted lines
- Support Focus (dense) vs Coaching (paginated depth) progressive disclosure
- Show review summary above code; naming check + suggestion in the insight panel
- Keep Prev/Next navigation viewport-fixed so it does not jump with content height
- Allow deterministic next/back progression and timeline jumps
- Preserve fixed sequence: `arrange -> act -> assert -> smell? -> review`

## Technical Approach

The system separates **walkthrough source** from **walkthrough presentation**.

```
Walkthrough Source
          │
          ▼
Validated Walkthrough Object
          │
          ▼
Interactive Walkthrough Engine
          │
          ▼
Animated Learning Experience
```

The walkthrough engine is the product.

Any model-based generation is optional and stays at the boundary of the system.

## MVP Scope

### Must Have

- Choose from 3 curated example tests
- Load validated walkthrough object (including Socratic `instruction` per step)
- Identify Arrange / Act / Assert
- Surface one testing smell (optional per example; present on shipped examples)
- Interactive step-by-step walkthrough with Focus / Coaching modes
- Senior engineer review summary, naming check, and one suggested improvement
- Fixed footer Prev/Next navigation
- Deterministic behavior with no external API dependency

### Stretch

- Additional examples
- Generate walkthrough via LLM source adapter
- Paste a custom test
- Enhanced animations

### Out of Scope

- Authentication
- User accounts
- Persistence
- Multiple languages/frameworks
- AI chat
- Dark mode
- Test generation
- Code editing
- Learning history
- Shareable walkthrough URLs

## Success Criteria

The user should feel they experienced something meaningfully different from asking an LLM for a static explanation.

A successful prototype should satisfy:

- First meaningful highlighted insight appears within seconds of app load
- Full walkthrough can be completed in under 2 minutes
- Interaction clearly teaches AAA and one testing smell
- Progressive disclosure works (Focus is default; Coaching is available without leaving the step)
- User leaves with the impression:

> "I understand not just what this test does, but how an experienced engineer thinks about it."

## Future Direction

The interaction pattern is designed to generalize beyond unit tests.

Potential walkthroughs include:

- SQL queries
- Infrastructure-as-Code
- React components
- Pull request reviews
- System architecture
- Production incidents

The longer-term opportunity is an interactive engineering mentor that makes expert reasoning observable across many software engineering artifacts.