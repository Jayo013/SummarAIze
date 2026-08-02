import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveProviderOrder } from "./summarize.service";

test("resolveProviderOrder defaults to gemini, groq, openai when no preference is set", () => {
  assert.deepEqual(resolveProviderOrder(), ["gemini", "groq", "openai"]);
  assert.deepEqual(resolveProviderOrder(null), ["gemini", "groq", "openai"]);
});

test("resolveProviderOrder puts the preferred provider first and keeps the rest as fallbacks", () => {
  assert.deepEqual(resolveProviderOrder("openai"), ["openai", "gemini", "groq"]);
  assert.deepEqual(resolveProviderOrder("groq"), ["groq", "gemini", "openai"]);
});

test("resolveProviderOrder falls back to default order for an unknown provider", () => {
  assert.deepEqual(resolveProviderOrder("not-a-real-provider"), ["gemini", "groq", "openai"]);
});
