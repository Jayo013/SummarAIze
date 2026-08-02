import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_CONTEXT_TURNS, recentHistory, systemPrompt, type ChatTurn } from "./chatReply.service";

function turn(i: number): ChatTurn {
  return { role: i % 2 === 0 ? "user" : "assistant", content: `turn-${i}` };
}

test("recentHistory returns everything when under the window size", () => {
  const history = [turn(0), turn(1), turn(2)];
  assert.deepEqual(recentHistory(history), history);
});

test("recentHistory caps to the last MAX_CONTEXT_TURNS entries (token optimization)", () => {
  const history = Array.from({ length: MAX_CONTEXT_TURNS + 5 }, (_, i) => turn(i));
  const windowed = recentHistory(history);
  assert.equal(windowed.length, MAX_CONTEXT_TURNS);
  // Must keep the most recent turns, not the oldest.
  assert.deepEqual(windowed, history.slice(-MAX_CONTEXT_TURNS));
});

test("systemPrompt grounds the assistant in the summary text and mode", () => {
  const prompt = systemPrompt({ modeLabel: "Executive Summary", summaryText: "Revenue grew 12% this quarter." });
  assert.match(prompt, /Executive Summary/);
  assert.match(prompt, /Revenue grew 12% this quarter\./);
  assert.match(prompt, /strictly on the summary/i);
});
