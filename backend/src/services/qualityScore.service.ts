import { countWords } from "../utils/text";
import type { SummaryMode } from "./summaryModes";

export interface QualityResult {
  score: number;
  flags: string[];
}

// Modes that are supposed to compress heavily; a "summary" that's nearly as long as the
// source has failed at its one job even if every word in it is grounded.
const CONCISE_MODES = new Set<SummaryMode>(["quick", "executive", "key_takeaways"]);

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

// A free, zero-latency proxy for "did the model stick to the source" — no extra LLM call
// (an LLM-as-judge pass would be more accurate but doubles cost and latency per summary; this
// heuristic is the pragmatic default, with judge-based scoring as a documented upgrade path).
// It measures what fraction of the summary's substantive words actually appear somewhere in
// the source text. A low ratio means the model likely introduced content that isn't there.
export function scoreSummary(params: {
  mode: SummaryMode;
  inputText: string;
  outputText: string;
  structured: boolean;
}): QualityResult {
  const { mode, inputText, outputText, structured } = params;
  const flags: string[] = [];

  const outputWords = significantWords(outputText);
  if (outputWords.length === 0) {
    return { score: 0, flags: ["empty_output"] };
  }

  let score = 100;

  const inputWordSet = new Set(significantWords(inputText));
  const groundedCount = outputWords.filter((w) => inputWordSet.has(w)).length;
  const groundingRatio = groundedCount / outputWords.length;

  if (groundingRatio < 0.35) {
    flags.push("possible_hallucination");
    score -= 40;
  } else if (groundingRatio < 0.55) {
    score -= 15;
  }

  const inputWordCount = countWords(inputText);
  const outputWordCount = countWords(outputText);
  if (CONCISE_MODES.has(mode) && inputWordCount > 0 && outputWordCount / inputWordCount > 0.6) {
    flags.push("not_concise");
    score -= 15;
  }

  if (!structured) {
    flags.push("unstructured_fallback");
    score -= 5;
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), flags };
}
