import { z } from "zod";
import type { SummaryMode } from "../services/summaryModes";

const QuickSchema = z.object({ bullets: z.array(z.string().min(1)).min(1) });
const DetailedSchema = z.object({ paragraphs: z.array(z.string().min(1)).min(1) });
const StudyNotesSchema = z.object({
  sections: z.array(z.object({ heading: z.string().min(1), points: z.array(z.string().min(1)).min(1) })).min(1),
});
const ExecutiveSchema = z.object({ summary: z.string().min(1) });
const MeetingMinutesSchema = z.object({
  attendees: z.array(z.string()),
  discussionPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  nextSteps: z.array(z.string()),
});
const KeyTakeawaysSchema = z.object({ takeaways: z.array(z.string().min(1)).min(1) });
const ActionItemsSchema = z.object({
  items: z.array(
    z.object({
      task: z.string().min(1),
      owner: z.string().nullable().optional(),
      deadline: z.string().nullable().optional(),
    })
  ),
});

export const SUMMARY_JSON_SCHEMAS = {
  quick: QuickSchema,
  detailed: DetailedSchema,
  study_notes: StudyNotesSchema,
  executive: ExecutiveSchema,
  meeting_minutes: MeetingMinutesSchema,
  key_takeaways: KeyTakeawaysSchema,
  action_items: ActionItemsSchema,
} as const satisfies Record<SummaryMode, z.ZodTypeAny>;

export type SummaryJson<M extends SummaryMode = SummaryMode> = z.infer<(typeof SUMMARY_JSON_SCHEMAS)[M]>;

// Turns a raw model response into validated, typed JSON — or null if it's not valid JSON at
// all, or valid JSON that doesn't match the expected shape (a common failure mode when a
// model "almost" follows instructions, e.g. wrapping the object in an extra field). Callers
// treat null the same as a provider error: it triggers the normal fallback to the next
// provider rather than surfacing malformed data to the user.
export function parseSummaryJson<M extends SummaryMode>(mode: M, raw: string): SummaryJson<M> | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const schema = SUMMARY_JSON_SCHEMAS[mode];
  const result = schema.safeParse(data);
  return result.success ? (result.data as SummaryJson<M>) : null;
}
