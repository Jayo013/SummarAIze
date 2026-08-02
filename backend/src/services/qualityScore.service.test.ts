import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreSummary } from "./qualityScore.service";

const SOURCE =
  "The quarterly revenue grew twelve percent driven by strong enterprise renewals, with the " +
  "sales team closing several multi-year contracts during the final two weeks of the quarter. " +
  "The support team reduced average response time to two hours after adopting a new ticketing " +
  "workflow and cross-training junior staff on the most common escalation categories. Churn " +
  "stayed flat quarter over quarter even as the customer base grew by nearly fifteen percent, " +
  "which the leadership team attributed to the improved onboarding sequence introduced in the " +
  "prior quarter. Marketing spend was held roughly constant while lead quality improved.";

test("a well-grounded, concise structured summary scores high with no flags", () => {
  const result = scoreSummary({
    mode: "quick",
    inputText: SOURCE,
    outputText: "• Quarterly revenue grew twelve percent from enterprise renewals.\n• Support response time dropped to two hours.",
    structured: true,
  });
  assert.ok(result.score >= 80, `expected high score, got ${result.score}`);
  assert.deepEqual(result.flags, []);
});

test("a summary full of words absent from the source is flagged as a possible hallucination", () => {
  const result = scoreSummary({
    mode: "quick",
    inputText: SOURCE,
    outputText:
      "• The company acquired a competitor for two billion dollars in cryptocurrency.\n• Leadership announced relocation to Antarctica.",
    structured: true,
  });
  assert.ok(result.flags.includes("possible_hallucination"));
  assert.ok(result.score < 80, `expected a penalized score, got ${result.score}`);
});

test("a concise-mode summary nearly as long as the source is flagged not_concise", () => {
  const result = scoreSummary({
    mode: "executive",
    inputText: SOURCE,
    outputText: SOURCE, // worst case: verbatim copy, technically fully grounded but not a summary
    structured: true,
  });
  assert.ok(result.flags.includes("not_concise"));
});

test("empty output scores zero and is flagged, without dividing by zero", () => {
  const result = scoreSummary({ mode: "quick", inputText: SOURCE, outputText: "   ", structured: true });
  assert.deepEqual(result, { score: 0, flags: ["empty_output"] });
});

test("unstructured (text-fallback) output is flagged and scores slightly lower than an equivalent structured one", () => {
  const outputText = "• Quarterly revenue grew twelve percent from enterprise renewals.";
  const structured = scoreSummary({ mode: "quick", inputText: SOURCE, outputText, structured: true });
  const unstructured = scoreSummary({ mode: "quick", inputText: SOURCE, outputText, structured: false });
  assert.ok(unstructured.flags.includes("unstructured_fallback"));
  assert.ok(unstructured.score < structured.score);
});

test("score is always clamped between 0 and 100", () => {
  const result = scoreSummary({
    mode: "executive",
    inputText: SOURCE,
    outputText: "completely unrelated fabricated nonsense about dragons and spaceships exceeding source length by a wide margin " + SOURCE,
    structured: false,
  });
  assert.ok(result.score >= 0 && result.score <= 100);
});
