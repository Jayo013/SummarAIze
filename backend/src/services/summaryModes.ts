export const SUMMARY_MODES = [
  "quick",
  "detailed",
  "study_notes",
  "executive",
  "meeting_minutes",
  "key_takeaways",
  "action_items",
] as const;

export type SummaryMode = (typeof SUMMARY_MODES)[number];

export const SUMMARY_MODE_LABELS: Record<SummaryMode, string> = {
  quick: "Quick Summary",
  detailed: "Detailed Summary",
  study_notes: "Study Notes",
  executive: "Executive Summary",
  meeting_minutes: "Meeting Minutes",
  key_takeaways: "Key Takeaways",
  action_items: "Action Items",
};

export const SUMMARY_MODE_PROMPTS: Record<SummaryMode, string> = {
  quick: "Summarize the following notes into exactly 5 concise, factual bullet points.",
  detailed:
    "Write a detailed, thorough summary of the following notes, covering all major points and supporting details. Use multiple paragraphs or nested bullet points as needed.",
  study_notes:
    "Convert the following notes into structured study notes for exam review: organize with clear headings, key definitions, and bullet points.",
  executive:
    "Write a concise executive summary of the following notes for a busy stakeholder audience, in 3-4 sentences focused on the bottom line and business impact.",
  meeting_minutes:
    "Convert the following notes into formal meeting minutes with these sections: Attendees, Discussion Points, Decisions Made, and Next Steps. Write 'Not specified' for any section with no relevant information.",
  key_takeaways:
    "Extract the key takeaways from the following notes as a bulleted list of the most important insights, ordered by importance.",
  action_items:
    "Extract all action items from the following notes as a checklist (format: '- [ ] Task — Owner/Deadline if mentioned'). If no explicit action items exist, infer reasonable next steps from the content.",
};
