import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSummaryJson } from "./schemas";

test("parseSummaryJson accepts well-formed JSON matching the mode's schema", () => {
  const raw = JSON.stringify({ bullets: ["First point.", "Second point."] });
  const parsed = parseSummaryJson("quick", raw);
  assert.deepEqual(parsed, { bullets: ["First point.", "Second point."] });
});

test("parseSummaryJson returns null for syntactically invalid JSON", () => {
  assert.equal(parseSummaryJson("quick", "{ not: valid json"), null);
});

test("parseSummaryJson returns null when the JSON doesn't match the schema shape", () => {
  // A model that ignores instructions and returns prose-as-JSON, or the wrong field name.
  assert.equal(parseSummaryJson("quick", JSON.stringify({ summary: "wrong shape for quick mode" })), null);
  assert.equal(parseSummaryJson("meeting_minutes", JSON.stringify({ attendees: "should be an array" })), null);
});

test("parseSummaryJson enforces empty-array-over-fabrication for meeting minutes", () => {
  const raw = JSON.stringify({ attendees: [], discussionPoints: ["Q3 roadmap"], decisions: [], nextSteps: [] });
  const parsed = parseSummaryJson("meeting_minutes", raw);
  assert.deepEqual(parsed, { attendees: [], discussionPoints: ["Q3 roadmap"], decisions: [], nextSteps: [] });
});

test("parseSummaryJson accepts null owner/deadline for action items", () => {
  const raw = JSON.stringify({ items: [{ task: "Ship the report", owner: null, deadline: null }] });
  const parsed = parseSummaryJson("action_items", raw);
  assert.deepEqual(parsed, { items: [{ task: "Ship the report", owner: null, deadline: null }] });
});
