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
