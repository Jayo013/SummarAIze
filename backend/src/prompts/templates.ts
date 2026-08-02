import type { SummaryMode } from "../services/summaryModes";

export type PromptResponseFormat = "text" | "json";

export interface PromptTemplate {
  version: string;
  responseFormat: PromptResponseFormat;
  instructions: string;
}

const GROUNDING_RULE =
  'Only use information explicitly present in the source text below. Never invent names, numbers, dates, or claims that are not stated. If something is not present, omit it or write "Not specified" — do not guess.';

// v1 — the original free-text prompts shipped with the first summarize feature. Kept (not
// just deleted) so ACTIVE_PROMPT_VERSION can be flipped back per-mode as an instant rollback
// if a provider's JSON mode ever misbehaves, without losing the prior prompt wording.
const V1: Record<SummaryMode, PromptTemplate> = {
  quick: {
    version: "v1",
    responseFormat: "text",
    instructions: "Summarize the following notes into exactly 5 concise, factual bullet points.",
  },
  detailed: {
    version: "v1",
    responseFormat: "text",
    instructions:
      "Write a detailed, thorough summary of the following notes, covering all major points and supporting details. Use multiple paragraphs or nested bullet points as needed.",
  },
  study_notes: {
    version: "v1",
    responseFormat: "text",
    instructions:
      "Convert the following notes into structured study notes for exam review: organize with clear headings, key definitions, and bullet points.",
  },
  executive: {
    version: "v1",
    responseFormat: "text",
    instructions:
      "Write a concise executive summary of the following notes for a busy stakeholder audience, in 3-4 sentences focused on the bottom line and business impact.",
  },
  meeting_minutes: {
    version: "v1",
    responseFormat: "text",
    instructions:
      "Convert the following notes into formal meeting minutes with these sections: Attendees, Discussion Points, Decisions Made, and Next Steps. Write 'Not specified' for any section with no relevant information.",
  },
  key_takeaways: {
    version: "v1",
    responseFormat: "text",
    instructions:
      "Extract the key takeaways from the following notes as a bulleted list of the most important insights, ordered by importance.",
  },
  action_items: {
    version: "v1",
    responseFormat: "text",
    instructions:
      "Extract all action items from the following notes as a checklist (format: '- [ ] Task — Owner/Deadline if mentioned'). If no explicit action items exist, infer reasonable next steps from the content.",
  },
};

// v2 — grounded + structured JSON. Constraining the model to a specific schema (rather than
// free-form prose) both reduces hallucination, since there's no room to ramble past the
// source, and makes the output reliably parseable. prompts/schemas.ts validates what comes
// back against exactly this shape.
const V2: Record<SummaryMode, PromptTemplate> = {
  quick: {
    version: "v2",
    responseFormat: "json",
    instructions: `${GROUNDING_RULE}\n\nReturn JSON only, matching this shape: { "bullets": string[] } — exactly 5 concise, factual bullet points summarizing the text.`,
  },
  detailed: {
    version: "v2",
    responseFormat: "json",
    instructions: `${GROUNDING_RULE}\n\nReturn JSON only, matching this shape: { "paragraphs": string[] } — a thorough summary covering all major points and supporting details, as 2-5 paragraphs.`,
  },
  study_notes: {
    version: "v2",
    responseFormat: "json",
    instructions: `${GROUNDING_RULE}\n\nReturn JSON only, matching this shape: { "sections": { "heading": string, "points": string[] }[] } — structured study notes organized under clear headings for exam review.`,
  },
  executive: {
    version: "v2",
    responseFormat: "json",
    instructions: `${GROUNDING_RULE}\n\nReturn JSON only, matching this shape: { "summary": string } — 3-4 sentences for a busy stakeholder audience, focused on the bottom line and business impact.`,
  },
  meeting_minutes: {
    version: "v2",
    responseFormat: "json",
    instructions: `${GROUNDING_RULE}\n\nReturn JSON only, matching this shape: { "attendees": string[], "discussionPoints": string[], "decisions": string[], "nextSteps": string[] }. Use an empty array for any section with no relevant information — do not fabricate content to fill it.`,
  },
  key_takeaways: {
    version: "v2",
    responseFormat: "json",
    instructions: `${GROUNDING_RULE}\n\nReturn JSON only, matching this shape: { "takeaways": string[] } — the most important insights, ordered by importance.`,
  },
  action_items: {
    version: "v2",
    responseFormat: "json",
    instructions: `${GROUNDING_RULE}\n\nReturn JSON only, matching this shape: { "items": { "task": string, "owner": string | null, "deadline": string | null }[] }. Use null for owner/deadline when not mentioned. If no explicit action items exist, infer reasonable next steps from the content instead of leaving items empty.`,
  },
};

const PROMPT_VERSIONS: Record<string, Record<SummaryMode, PromptTemplate>> = { v1: V1, v2: V2 };

export const ACTIVE_PROMPT_VERSION = "v2";

export function getPromptTemplate(mode: SummaryMode, version: string = ACTIVE_PROMPT_VERSION): PromptTemplate {
  const template = PROMPT_VERSIONS[version]?.[mode];
  if (!template) throw new Error(`No prompt template for mode "${mode}" at version "${version}".`);
  return template;
}

export function getActivePromptTemplate(mode: SummaryMode): PromptTemplate {
  return getPromptTemplate(mode, ACTIVE_PROMPT_VERSION);
}

export function buildGeminiPrompt(template: PromptTemplate, text: string): string {
  return `${template.instructions}\n\n${text}`;
}
