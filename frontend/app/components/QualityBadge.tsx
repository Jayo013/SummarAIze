"use client";

import Badge from "./ui/Badge";

const FLAG_LABELS: Record<string, string> = {
  possible_hallucination: "May include details not found in the source text",
  not_concise: "Longer than expected for this summary style",
  unstructured_fallback: "Generated in a fallback mode without schema validation",
  empty_output: "No usable content was generated",
};

function toneForScore(score: number): "success" | "warning" | "danger" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

export default function QualityBadge({ score, flags }: { score: number; flags: string[] }) {
  const title = flags.length ? flags.map((f) => FLAG_LABELS[f] ?? f).join(" · ") : "No quality concerns detected";

  return (
    <Badge tone={toneForScore(score)} title={title}>
      Quality {score}
      {flags.length > 0 ? " ⚠" : ""}
    </Badge>
  );
}
