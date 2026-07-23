// One representative end-to-end interaction flow for the walkthrough engine.
//
// Renders the real `ReplayApp` (which hydrates a curated example and mounts the
// engine) and drives it the way a user would: step navigation via button and
// keyboard, Focus/Coaching toggle, timeline number-key jump, and the recoverable
// error state. Selectors are roles/text drawn from the real DOM, not snapshots.

import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReplayApp from "@/components/ReplayApp";
import {
  CuratedWalkthroughSource,
  WalkthroughValidationError,
} from "@/lib/walkthrough";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReplayApp walkthrough interaction", () => {
  it("renders the initial arrange step with its lens question", () => {
    render(<ReplayApp />);

    // Step-focus meta line: "Step 1 of 5 • ARRANGE".
    expect(screen.getByText(/Step 1 of 5/)).toBeInTheDocument();
    // Fixed arrange lens question in the step-focus card heading.
    expect(
      screen.getByRole("heading", { name: "What are we setting up?" })
    ).toBeInTheDocument();
    // Focus mode is the default: the "Question" block is visible.
    expect(screen.getByText("Question")).toBeInTheDocument();
    expect(screen.getByText("What to notice")).toBeInTheDocument();
  });

  it("advances through the timeline to the review step via the Next button", async () => {
    const user = userEvent.setup();
    render(<ReplayApp />);

    const next = () => screen.getByRole("button", { name: "Next" });
    // arrange -> act -> assert -> smell -> review == four Next clicks.
    for (let i = 0; i < 4; i += 1) {
      await user.click(next());
    }

    expect(screen.getByText(/Step 5 of 5/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Senior Engineer Review" })
    ).toBeInTheDocument();
    // At the end, Next is disabled.
    expect(next()).toBeDisabled();
  });

  it("advances with the keyboard arrow / bracket shortcuts", async () => {
    const user = userEvent.setup();
    render(<ReplayApp />);

    await user.keyboard("{ArrowRight}");
    expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What behavior are we exercising?" })
    ).toBeInTheDocument();

    await user.keyboard("]");
    expect(screen.getByText(/Step 3 of 5/)).toBeInTheDocument();
  });

  it("defaults to Focus and reveals the coaching pager when toggled", async () => {
    const user = userEvent.setup();
    render(<ReplayApp />);

    const focusBtn = screen.getByRole("button", { name: "Focus" });
    const coachingBtn = screen.getByRole("button", { name: "Coaching" });
    expect(focusBtn).toHaveAttribute("aria-pressed", "true");
    expect(coachingBtn).toHaveAttribute("aria-pressed", "false");

    // Toggle via the `c` keyboard shortcut.
    await user.keyboard("c");
    expect(coachingBtn).toHaveAttribute("aria-pressed", "true");

    // The coaching pager appears with a card counter.
    const pager = screen.getByRole("group", { name: "Coaching cards" });
    expect(pager).toBeInTheDocument();
    expect(within(pager).getByText(/^\d+ \/ \d+$/)).toBeInTheDocument();
  });

  it("disables the Focus/Coaching toggle on the review step", async () => {
    const user = userEvent.setup();
    render(<ReplayApp />);

    // Jump straight to review with the timeline number key.
    await user.keyboard("5");
    expect(
      screen.getByRole("heading", { name: "Senior Engineer Review" })
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Focus" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Coaching" })).toBeDisabled();

    // The review insight column shows the naming check and suggestion.
    expect(screen.getByText("Naming check")).toBeInTheDocument();
    expect(screen.getByText("Suggested improvement")).toBeInTheDocument();
  });

  it("jumps to the review step with the number key matching Step M of M", async () => {
    const user = userEvent.setup();
    render(<ReplayApp />);

    await user.keyboard("5");

    expect(screen.getByText(/Step 5 of 5/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Senior Engineer Review" })
    ).toBeInTheDocument();
  });

  it("renders the recoverable error state when hydration fails validation", () => {
    // Force the same code path ReplayApp uses (CuratedWalkthroughSource.hydrate)
    // to throw a validation error, exercising the recoverable error UI.
    const issues = [
      "walkthrough.assert: endLine (99) exceeds sourceCode line count (16)",
    ];
    vi.spyOn(CuratedWalkthroughSource, "hydrate").mockImplementation(() => {
      throw new WalkthroughValidationError(issues);
    });

    render(<ReplayApp />);

    const alert = screen.getByRole("alert");
    expect(
      within(alert).getByText("This walkthrough could not load")
    ).toBeInTheDocument();
    expect(within(alert).getByText(issues[0])).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset to curated example" })
    ).toBeInTheDocument();
  });
});
