import { test } from "node:test";
import assert from "node:assert/strict";
import { renderStructuredSummary } from "./promptRenderer";

test("renders quick/key_takeaways bullets with a leading bullet marker", () => {
  assert.equal(renderStructuredSummary("quick", { bullets: ["A", "B"] }), "• A\n• B");
  assert.equal(renderStructuredSummary("key_takeaways", { takeaways: ["X"] }), "• X");
});

test("renders detailed paragraphs separated by a blank line", () => {
  assert.equal(renderStructuredSummary("detailed", { paragraphs: ["P1", "P2"] }), "P1\n\nP2");
});

test("renders study notes as heading + bullet points per section", () => {
  const out = renderStructuredSummary("study_notes", {
    sections: [{ heading: "Intro", points: ["a", "b"] }],
  });
  assert.equal(out, "Intro\n- a\n- b");
});

test("renders executive summary as the raw sentence", () => {
  assert.equal(renderStructuredSummary("executive", { summary: "Bottom line up front." }), "Bottom line up front.");
});

test("renders meeting minutes with 'Not specified' for empty sections instead of fabricating content", () => {
  const out = renderStructuredSummary("meeting_minutes", {
    attendees: [],
    discussionPoints: ["Budget"],
    decisions: [],
    nextSteps: [],
  });
  assert.match(out, /Attendees:\nNot specified/);
  assert.match(out, /Discussion Points:\n- Budget/);
  assert.match(out, /Decisions Made:\nNot specified/);
});

test("renders action items as a markdown checklist with owner/deadline suffix", () => {
  const out = renderStructuredSummary("action_items", {
    items: [{ task: "Ship it", owner: "Alex", deadline: "Friday" }],
  });
  assert.equal(out, "- [ ] Ship it (Alex — Friday)");
});

test("renders a placeholder line when there are no action items at all", () => {
  assert.equal(renderStructuredSummary("action_items", { items: [] }), "- [ ] No explicit action items found.");
});
