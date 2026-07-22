import type { WalkthroughStep } from "@/lib/walkthrough";

export type CoachingCardKind = "text" | "list" | "smell";

export interface CoachingCard {
  id: string;
  title: string;
  kind: CoachingCardKind;
  body?: string;
  items?: string[];
  before?: string;
  after?: string;
}

/**
 * Build the ordered coaching-mode cards for a non-review step.
 * Order (per spec): Question -> What to notice -> Mentor take -> Common pitfall
 * -> optional Deeper context -> (smell only) Smell example.
 */
export function buildCoachingCards(step: WalkthroughStep): CoachingCard[] {
  const { instruction } = step;

  const cards: CoachingCard[] = [
    { id: "question", title: "Question", kind: "text", body: instruction.question },
    { id: "notice", title: "What to notice", kind: "list", items: instruction.evidence },
    { id: "mentor", title: "Mentor take", kind: "text", body: instruction.mentorTake },
    { id: "pitfall", title: "Common pitfall", kind: "text", body: instruction.failureMode },
  ];

  if (instruction.deepDive && instruction.deepDive.length > 0) {
    cards.push({
      id: "deep-dive",
      title: "Deeper context",
      kind: "list",
      items: instruction.deepDive,
    });
  }

  if (step.kind === "smell" && step.example) {
    cards.push({
      id: "smell-example",
      title: "Smell example",
      kind: "smell",
      before: step.example.before,
      after: step.example.after,
    });
  }

  return cards;
}
