import type { SummaryMode } from "./summaryModes";
import type { SummaryJson } from "../prompts/schemas";

// Converts validated structured JSON into the same plain-text format the UI, PDF export,
// share pages, and chat grounding already expect — so moving generation to structured JSON
// (Feature 10) is invisible everywhere else in the app.
export function renderStructuredSummary(mode: SummaryMode, json: SummaryJson): string {
  switch (mode) {
    case "quick": {
      const { bullets } = json as SummaryJson<"quick">;
      return bullets.map((b) => `• ${b}`).join("\n");
    }
    case "key_takeaways": {
      const { takeaways } = json as SummaryJson<"key_takeaways">;
      return takeaways.map((t) => `• ${t}`).join("\n");
    }
    case "detailed": {
      const { paragraphs } = json as SummaryJson<"detailed">;
      return paragraphs.join("\n\n");
    }
    case "study_notes": {
      const { sections } = json as SummaryJson<"study_notes">;
      return sections
        .map((s) => `${s.heading}\n` + s.points.map((p) => `- ${p}`).join("\n"))
        .join("\n\n");
    }
    case "executive": {
      const { summary } = json as SummaryJson<"executive">;
      return summary;
    }
    case "meeting_minutes": {
      const mm = json as SummaryJson<"meeting_minutes">;
      const section = (label: string, items: string[]) =>
        `${label}:\n` + (items.length ? items.map((i) => `- ${i}`).join("\n") : "Not specified");
      return [
        section("Attendees", mm.attendees),
        section("Discussion Points", mm.discussionPoints),
        section("Decisions Made", mm.decisions),
        section("Next Steps", mm.nextSteps),
      ].join("\n\n");
    }
    case "action_items": {
      const { items } = json as SummaryJson<"action_items">;
      if (!items.length) return "- [ ] No explicit action items found.";
      return items
        .map((i) => {
          const suffix = [i.owner, i.deadline].filter(Boolean).join(" — ");
          return `- [ ] ${i.task}${suffix ? ` (${suffix})` : ""}`;
        })
        .join("\n");
    }
    default: {
      const exhaustiveCheck: never = mode;
      throw new Error(`No renderer for summary mode "${exhaustiveCheck}".`);
    }
  }
}
