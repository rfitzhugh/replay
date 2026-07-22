// Curated walkthrough examples for the MVP.
//
// Each example is a realistic Jest-style unit test paired with a fully-authored
// walkthrough. The three examples deliberately teach three distinct
// brittle-assertion smells:
//   1. discount-eligible-customer     -> full-object equality assertion
//   2. order-submission-async         -> over-specified mock-call assertion
//   3. inventory-low-stock-notification -> brittle exact-string match
//
// `startLine` / `endLine` are 1-indexed line numbers into each `sourceCode`.
// `example.before` / `example.after` are standalone snippets, NOT slices of
// `sourceCode`.

import type { WalkthroughExample } from "./types";

// ---------------------------------------------------------------------------
// 1. discount-eligible-customer — smell: full-object equality assertion
// ---------------------------------------------------------------------------

const discountEligibleCustomer: WalkthroughExample = {
  id: "discount-eligible-customer",
  title: "Discount for loyalty members",
  description:
    "A pricing test that computes a loyalty discount and checks the returned quote.",
  sourceCode: `import { getDiscount } from "../pricing";

it("returns a 10% discount for loyalty members", () => {
  const customer = { id: 7, tier: "loyalty", joinedYears: 3 };
  const cart = { subtotal: 200 };

  const result = getDiscount(customer, cart);

  expect(result).toEqual({
    customerId: 7,
    discountRate: 0.1,
    discountAmount: 20,
    finalTotal: 180,
    currency: "USD",
  });
});`,
  walkthrough: {
    arrange: {
      id: "discount-arrange",
      kind: "arrange",
      explanation:
        "The test builds two plain objects: a loyalty-tier customer and a cart with a $200 subtotal. Nothing here is discovered from the system under test — these are the fixed inputs that make the expected discount predictable.",
      instruction: {
        question:
          "Which fields on `customer` and `cart` actually drive the discount, and which are just decoration?",
        evidence: [
          "`tier: \"loyalty\"` is the field the discount rule almost certainly keys on.",
          "`subtotal: 200` is the number the 10% and $20 figures are derived from.",
          "`joinedYears: 3` and `id: 7` are set but never asserted against behaviorally.",
        ],
        mentorTake:
          "Good arrange sections make the causal fields obvious. A reader should be able to predict the outcome from the inputs before ever looking at the assertion.",
        failureMode:
          "Padding fixtures with fields that don't affect the result (like `joinedYears`) makes readers hunt for which input mattered.",
        deepDive: [
          "If `joinedYears` is irrelevant to this rule, consider a factory like `makeCustomer({ tier: \"loyalty\" })` so only the meaningful override is visible.",
        ],
      },
      startLine: 4,
      endLine: 5,
    },
    act: {
      id: "discount-act",
      kind: "act",
      explanation:
        "A single call to `getDiscount(customer, cart)` exercises the behavior. There is exactly one action, so any failure points squarely at this function.",
      instruction: {
        question:
          "Is there exactly one behavior being exercised here, or is the call doing more than one thing?",
        evidence: [
          "Only one function is invoked: `getDiscount`.",
          "The result is captured in `result` for later inspection rather than asserted inline.",
        ],
        mentorTake:
          "One act per test keeps failures diagnosable. When a test fails you want it to name a single suspect.",
        failureMode:
          "Chaining several calls in the act phase turns a red test into a guessing game about which step broke.",
      },
      startLine: 7,
      endLine: 7,
    },
    assert: {
      id: "discount-assert",
      kind: "assert",
      explanation:
        "The assertion pins every field of the returned quote at once with `toEqual`, including `currency` and `customerId`, which are echoed straight from the input.",
      instruction: {
        question:
          "Of the five asserted fields, which ones actually express the behavior this test claims to verify?",
        evidence: [
          "`discountRate: 0.1` and `discountAmount: 20` are the real subjects of a discount test.",
          "`finalTotal: 180` confirms the arithmetic (200 - 20).",
          "`currency` and `customerId` are pass-through values, not computed outcomes.",
        ],
        mentorTake:
          "Assert on the outcome the test name promises. Everything else is noise that will eventually break for the wrong reason.",
        failureMode:
          "Verifying incidental fields couples the test to data it doesn't care about, so unrelated changes turn it red.",
      },
      startLine: 9,
      endLine: 15,
    },
    smell: {
      id: "discount-smell",
      kind: "smell",
      explanation:
        "The whole-object `toEqual` is over-specified. Adding a harmless field to the returned quote — say `taxRegion` — breaks a test that has nothing to do with tax, and the failure message buries the one line that matters (`discountRate`) in a five-field diff.",
      instruction: {
        question:
          "If a teammate adds a new non-discount field to the quote object, should this discount test fail?",
        evidence: [
          "`toEqual` demands an exact shape match, so any new field fails the test.",
          "The name promises a discount check, but the assertion enforces the entire response contract.",
          "A failure diff mixes the meaningful `discountRate` with pass-through fields.",
        ],
        mentorTake:
          "Assert narrowly on what the test is named for. Whole-object equality is a magnet for false failures as the object grows.",
        failureMode:
          "Treating `toEqual` as the default assertion, so tests silently take ownership of fields they never meant to guard.",
        deepDive: [
          "If the full contract genuinely matters, write a separate, clearly-named contract test rather than overloading the discount test.",
        ],
      },
      startLine: 3,
      endLine: 16,
      example: {
        before: `expect(result).toEqual({
  customerId: 7,
  discountRate: 0.1,
  discountAmount: 20,
  finalTotal: 180,
  currency: "USD",
});`,
        after: `expect(result.discountRate).toBe(0.1);
expect(result.discountAmount).toBe(20);
expect(result.finalTotal).toBe(180);`,
      },
    },
    review: {
      summary:
        "A focused, readable test with a clean arrange/act/assert shape. Its one weakness is an over-specified assertion that will break for reasons unrelated to discounting as the quote object evolves.",
      nameCheck:
        "Strong title: it states the behavior (returns a discount), the condition (loyalty members), and the expected outcome (10%). A reader knows what's under test before reading a line of the body.",
      suggestion:
        "Replace the whole-object `toEqual` with targeted assertions on `discountRate`, `discountAmount`, and `finalTotal` so the test only fails when the discount math actually changes.",
    },
  },
};

// ---------------------------------------------------------------------------
// 2. order-submission-async — smell: over-specified mock-call assertion
// ---------------------------------------------------------------------------

const orderSubmissionAsync: WalkthroughExample = {
  id: "order-submission-async",
  title: "Async order submission",
  description:
    "An async test that submits an order through a payment gateway and checks the result.",
  sourceCode: `import { submitOrder } from "../orders";

it("submits the order and returns a confirmation id", async () => {
  const gateway = { charge: jest.fn().mockResolvedValue({ ok: true }) };
  const order = { items: [{ sku: "A1", qty: 2 }], total: 50 };

  const confirmation = await submitOrder(order, gateway);

  expect(gateway.charge).toHaveBeenCalledWith({
    amount: 50,
    items: [{ sku: "A1", qty: 2 }],
    idempotencyKey: expect.any(String),
    timestamp: expect.any(Number),
  });
  expect(confirmation.id).toBeDefined();
});`,
  walkthrough: {
    arrange: {
      id: "order-arrange",
      kind: "arrange",
      explanation:
        "A stub `gateway.charge` is wired to resolve successfully, and a small order is built. The mock's resolved value keeps the async path on the happy branch so the test can focus on the confirmation.",
      instruction: {
        question:
          "Why does `charge` return a resolved promise here, and what would the test be exercising if it didn't?",
        evidence: [
          "`jest.fn().mockResolvedValue({ ok: true })` forces the successful async path.",
          "`order.total: 50` is the amount the later assertion expects `charge` to receive.",
          "The gateway is injected, so the test controls the dependency completely.",
        ],
        mentorTake:
          "Injecting and stubbing the gateway is the right move — it keeps the test deterministic and offline. The question is how tightly you then assert on that stub.",
        failureMode:
          "Forgetting `mockResolvedValue` leaves `charge` returning `undefined`, so `await` resolves to the wrong thing and the failure looks unrelated.",
      },
      startLine: 4,
      endLine: 5,
    },
    act: {
      id: "order-act",
      kind: "act",
      explanation:
        "The test `await`s `submitOrder(order, gateway)`. The `await` is load-bearing: without it the assertions would run before the async work settles.",
      instruction: {
        question:
          "What guarantees the confirmation is ready before the assertions run?",
        evidence: [
          "The call is `await`ed inside an `async` test function.",
          "The resolved value is captured in `confirmation` for the final assertion.",
        ],
        mentorTake:
          "In async tests the `await` is part of the behavior under test. Dropping it is the single most common cause of flaky, falsely-passing async tests.",
        failureMode:
          "Omitting `await` (or `return`) lets the test finish before the promise settles, so a broken code path can still appear green.",
      },
      startLine: 7,
      endLine: 7,
    },
    assert: {
      id: "order-assert",
      kind: "assert",
      explanation:
        "Two things are checked: that `charge` was called with a fully-specified payload, and that a confirmation id came back. The second assertion is the behavior the test name actually promises.",
      instruction: {
        question:
          "Which of these two assertions verifies the outcome the test is named for, and which verifies how the code got there?",
        evidence: [
          "`expect(confirmation.id).toBeDefined()` checks the promised outcome.",
          "The `toHaveBeenCalledWith({...})` block checks the internal call shape.",
          "`idempotencyKey` and `timestamp` are internal details the caller never asked about.",
        ],
        mentorTake:
          "Prefer asserting on observable results over the exact arguments passed to a collaborator. The result is the contract; the call shape is an implementation choice.",
        failureMode:
          "Leaning on `toHaveBeenCalledWith` for everything turns the test into a mirror of the implementation instead of a check on behavior.",
      },
      startLine: 9,
      endLine: 15,
    },
    smell: {
      id: "order-smell",
      kind: "smell",
      explanation:
        "The `toHaveBeenCalledWith` assertion pins the entire charge payload, including internal fields like `idempotencyKey` and `timestamp`. Any refactor that renames or adds a field to that payload breaks this test even when submission still works correctly.",
      instruction: {
        question:
          "If the team adds a `currency` field to the charge payload, should a test named for the confirmation id fail?",
        evidence: [
          "The assertion enumerates every argument key, so a new key fails the match.",
          "`idempotencyKey` and `timestamp` are implementation details, not caller-visible behavior.",
          "The meaningful outcome — a confirmation id — is checked almost as an afterthought on the last line.",
        ],
        mentorTake:
          "Assert on collaborators loosely. `expect.objectContaining` lets you pin the fields that matter (the amount) without freezing the whole internal payload.",
        failureMode:
          "Over-specified mock expectations couple tests to internals, so honest refactors trigger a wall of red and erode trust in the suite.",
        deepDive: [
          "If idempotency truly needs guarding, give it its own narrowly-scoped test rather than smuggling it into the submission test.",
        ],
      },
      startLine: 9,
      endLine: 14,
      example: {
        before: `expect(gateway.charge).toHaveBeenCalledWith({
  amount: 50,
  items: [{ sku: "A1", qty: 2 }],
  idempotencyKey: expect.any(String),
  timestamp: expect.any(Number),
});`,
        after: `expect(gateway.charge).toHaveBeenCalledWith(
  expect.objectContaining({ amount: 50 }),
);`,
      },
    },
    review: {
      summary:
        "The async plumbing is handled correctly — the gateway is injected and the call is properly awaited. The weak point is an over-specified mock assertion that freezes internal payload details the test doesn't actually care about.",
      nameCheck:
        "The title states the behavior (submits the order) and the expected outcome (returns a confirmation id), but leaves the condition implicit — it's really the successful-charge path. Naming that precondition would sharpen it.",
      suggestion:
        "Relax the `toHaveBeenCalledWith` to `expect.objectContaining({ amount: 50 })` so the test asserts the amount was charged without locking in `idempotencyKey` and `timestamp`.",
    },
  },
};

// ---------------------------------------------------------------------------
// 3. inventory-low-stock-notification — smell: brittle exact-string match
// ---------------------------------------------------------------------------

const inventoryLowStockNotification: WalkthroughExample = {
  id: "inventory-low-stock-notification",
  title: "Low-stock notification",
  description:
    "A test that fires a manager notification when a product drops below its stock threshold.",
  sourceCode: `import { checkStock } from "../inventory";

it("notifies the manager when stock falls below the threshold", () => {
  const notifier = { send: jest.fn() };
  const product = { name: "Widget", stock: 3, threshold: 5 };

  checkStock(product, notifier);

  expect(notifier.send).toHaveBeenCalledTimes(1);
  expect(notifier.send).toHaveBeenCalledWith(
    "LOW STOCK: Widget has 3 units left (threshold 5). Reorder now!"
  );
});`,
  walkthrough: {
    arrange: {
      id: "inventory-arrange",
      kind: "arrange",
      explanation:
        "A spy `notifier.send` stands in for the notification channel, and a product is set up with `stock: 3` sitting below `threshold: 5`. The inputs are chosen so the low-stock branch is guaranteed to fire.",
      instruction: {
        question:
          "What relationship between `stock` and `threshold` puts this test on the low-stock branch?",
        evidence: [
          "`stock: 3` is deliberately below `threshold: 5`.",
          "`notifier.send` is a spy, so the test can observe whether it was called.",
          "The `name: \"Widget\"` value will later show up inside the asserted message.",
        ],
        mentorTake:
          "Pick fixture numbers that make the branch obvious. `3 < 5` reads as 'clearly low' at a glance, which documents intent better than borderline values.",
        failureMode:
          "Choosing values right at the boundary (stock === threshold) hides whether you're testing 'below' or 'at or below', leaving the intended rule ambiguous.",
      },
      startLine: 4,
      endLine: 5,
    },
    act: {
      id: "inventory-act",
      kind: "act",
      explanation:
        "`checkStock(product, notifier)` runs the rule. It returns nothing useful; the behavior is a side effect on the injected notifier, which is why a spy was set up.",
      instruction: {
        question:
          "This function returns nothing to assert on — so where does the observable behavior actually show up?",
        evidence: [
          "The call's effect is a side effect, not a return value.",
          "The only observable signal is whether `notifier.send` was invoked.",
        ],
        mentorTake:
          "For side-effecting functions, the injected collaborator is your observation point. That's the whole reason the spy exists.",
        failureMode:
          "Expecting a return value from a void, side-effecting function leads to assertions that never meaningfully run.",
      },
      startLine: 7,
      endLine: 7,
    },
    assert: {
      id: "inventory-assert",
      kind: "assert",
      explanation:
        "The test confirms `send` fired exactly once, then checks the message it received by matching the full sentence character-for-character.",
      instruction: {
        question:
          "Which part of this assertion verifies that a notification happened, and which part verifies its exact wording?",
        evidence: [
          "`toHaveBeenCalledTimes(1)` verifies the notification fired — and fired only once.",
          "`toHaveBeenCalledWith(\"LOW STOCK: ...\")` pins the exact copy of the message.",
          "The message repeats the product name and both numbers, all of which are already in the fixture.",
        ],
        mentorTake:
          "Split 'did it notify' from 'what did it say'. The first is behavior; the second is copy that product and marketing will happily reword.",
        failureMode:
          "Folding a behavior check and an exact-wording check into one brittle assertion means a copy tweak masquerades as a broken feature.",
      },
      startLine: 9,
      endLine: 12,
    },
    smell: {
      id: "inventory-smell",
      kind: "smell",
      explanation:
        "Matching the notification's full sentence — punctuation, capitalization, and 'Reorder now!' included — makes the test a copy-editor. Rewording the message to 'Please reorder soon.' would break a test whose job is to confirm a low-stock alert was raised, not to police the exact phrasing.",
      instruction: {
        question:
          "If a product manager rewords the alert copy but the logic is untouched, should this test go red?",
        evidence: [
          "The assertion demands a byte-for-byte string match.",
          "The essential facts — product name and remaining count — are buried inside prose the test freezes wholesale.",
          "The test name is about the behavior, but the assertion guards the exact wording.",
        ],
        mentorTake:
          "Assert on the meaning, not the sentence. Match that the message mentions the product and the count; leave the phrasing free to change.",
        failureMode:
          "Exact-string assertions on user-facing copy make every wording change a test failure, which trains the team to reflexively update snapshots without thinking.",
        deepDive: [
          "If the message were built from a template, asserting on the template's structured inputs would be even more robust than string matching.",
        ],
      },
      startLine: 10,
      endLine: 12,
      example: {
        before: `expect(notifier.send).toHaveBeenCalledWith(
  "LOW STOCK: Widget has 3 units left (threshold 5). Reorder now!"
);`,
        after: `const [message] = notifier.send.mock.calls[0];
expect(message).toMatch(/widget/i);
expect(message).toContain("3");`,
      },
    },
    review: {
      summary:
        "The test correctly observes a side effect through a spy and confirms the notification fired once. It then overreaches by asserting the message's exact wording, coupling a behavior test to editorial copy.",
      nameCheck:
        "Excellent title: it names the behavior (notifies the manager), the condition (stock falls below the threshold), and the expected outcome (a notification). It reads like a specification sentence.",
      suggestion:
        "Keep `toHaveBeenCalledTimes(1)`, but replace the exact-string match with assertions that the message mentions the product name and the remaining count, so copy edits don't break the behavior test.",
    },
  },
};

/** The curated examples shipped with the MVP, in display order. */
export const examples: WalkthroughExample[] = [
  discountEligibleCustomer,
  orderSubmissionAsync,
  inventoryLowStockNotification,
];
