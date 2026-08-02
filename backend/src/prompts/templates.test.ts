import { test } from "node:test";
import assert from "node:assert/strict";
import { getPromptTemplate, getActivePromptTemplate, buildGeminiPrompt, ACTIVE_PROMPT_VERSION } from "./templates";
import { SUMMARY_MODES } from "../services/summaryModes";

test("every mode has both a v1 (text) and v2 (json) template", () => {
  for (const mode of SUMMARY_MODES) {
    assert.equal(getPromptTemplate(mode, "v1").responseFormat, "text");
    assert.equal(getPromptTemplate(mode, "v2").responseFormat, "json");
  }
});

test("the active version is v2 for every mode (current default)", () => {
  assert.equal(ACTIVE_PROMPT_VERSION, "v2");
  for (const mode of SUMMARY_MODES) {
    assert.equal(getActivePromptTemplate(mode).version, "v2");
  }
});

test("getPromptTemplate throws for an unknown version, so a bad rollback config fails loudly", () => {
  assert.throws(() => getPromptTemplate("quick", "v99"));
});

test("buildGeminiPrompt concatenates instructions and source text with a separating blank line", () => {
  const template = getPromptTemplate("quick", "v1");
  const prompt = buildGeminiPrompt(template, "Some source text.");
  assert.equal(prompt, `${template.instructions}\n\nSome source text.`);
});
