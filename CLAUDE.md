# CLAUDE.md

# Product Principles

When making implementation decisions, prioritize these principles:

- **Teach through interaction** - the interaction itself should communicate the lesson; avoid replacing interaction with text
- **Show, don't tell** - whenever possible highlight, animate, compare, simulate instead of adding more explanation
- **Progressive disclosure** - users should discover concepts one step at a time; avoid overwhelming users with every insight simultaneously
- **Code is the interface** - the code should remain the focal point and explanation should support the code, not replace it; avoid moving attention away from the editor

# Scope

This is an intentionally small prototype; optimize for:

- one polished interaction
- one memorable insight
- one excellent user journey

Do not optimize for feature count

Default to deterministic, curated walkthrough examples for the MVP. Live LLM analysis is optional and should not block the core experience

# Architecture Principles

## Separate source from presentation

Walkthrough sources produce structured semantic data

The frontend owns:

- highlighting
- animations
- sequencing
- interaction
- presentation

Never render raw LLM responses directly

The UI should consume typed `Walkthrough` objects only, regardless of whether they came from examples, cache, or an LLM source

## Structured outputs only

Walkthrough data should conform to the shared schema

Validate every response using Zod before rendering

Avoid free-form markdown responses from model-based sources

## Deterministic UI

The walkthrough should behave predictably

Animations, navigation, and rendering should never depend on ambiguous LLM output

Use a fixed interaction order for this prototype: `arrange -> act -> assert -> smell? -> review`

## Keep state simple

Prefer local React state

Avoid introducing global state unless absolutely necessary

# Coding Guidelines

## General

- Use strict TypeScript
- Prefer composition over inheritance
- Keep functions small and focused
- Prefer explicit types
- Avoid `any`
- Keep business logic outside React components

## Components

Components should primarily render UI

Business logic belongs in `lib/`

Prefer many small components over large components

## Styling

Use custom CSS (`app/globals.css`) with design tokens for the MVP

Prefer simple layouts

Animations should communicate learning, not decoration

Do not introduce Tailwind/shadcn

## Accessibility

Ensure keyboard navigation works

Maintain good color contrast

Do not rely on color alone to communicate walkthrough state

# Repository Structure

```
app/
components/
lib/
tests/
public/
```

## app/

Routing and future API endpoints

## components/

Reusable UI components

## lib/

Business logic

Examples:

- schemas
- walkthrough sources
- walkthrough validation
- walkthrough sequencing utilities

## tests/

Prototype confidence tests (primarily unit/component) for interaction flow and schema safety

# Common Workflows

## Adding a walkthrough step

When introducing a new walkthrough concept:

1. Update the response schema
2. Update walkthrough rendering
3. Add or update unit/component tests
4. Update built-in examples

## Adding a new example

1. Add example source code
2. Add or generate walkthrough JSON
3. Verify walkthrough quality
4. Ensure deterministic behavior

## Updating an LLM source adapter (optional)

Whenever modifying model-based generation:

- preserve the `Walkthrough` schema contract
- avoid changing field names without schema updates
- keep explanations concise
- optimize for structured output rather than prose

# Testing Strategy

The walkthrough experience is the product

Prioritize testing the interaction over implementation details

## Unit Tests

Test:

- walkthrough ordering
- step navigation
- schema validation
- helper functions

## Component Tests

Test one representative walkthrough flow end-to-end in the UI layer

Verify:

- deterministic rendering
- highlight transitions
- recovery from invalid walkthrough data

## Optional Integration/E2E

Add integration or e2e tests only after the core interaction is stable and time allows

# Build Quality

A feature is complete when:

- TypeScript passes
- ESLint passes
- Application builds
- Happy path works
- No console errors

If tests are included for the scoped change, they should pass before completion

# Decision Rubric

When multiple implementations are possible, choose the one that best satisfies the following:

1. Simpler architecture beats clever architecture
2. Deterministic behavior beats AI-generated UI
3. Reviewer understanding beats feature count
4. One polished interaction beats five incomplete ones
5. Teaching beats explaining
6. Showing beats telling

When unsure, ask:

> Does this implementation make engineering judgment more visible?

If the answer is "no," reconsider the design

# Anti-Patterns

Avoid:

- Large React components
- Hidden application state
- UI coupled to raw LLM responses
- Parsing markdown from the model
- Giant prompts that mix reasoning and presentation
- Walls of explanatory text
- Feature creep

# Future Direction

Replay is intentionally focused on unit tests

The interaction model should generalize to other engineering artifacts:

- SQL
- Infrastructure as Code
- React components
- Pull request reviews
- System architecture
- Production incidents

Design decisions should make these future extensions possible without adding unnecessary abstraction today