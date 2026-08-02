import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "./cn";

type Tone = "danger" | "success" | "info";

const toneConfig: Record<Tone, { classes: string; Icon: typeof AlertCircle }> = {
  danger: { classes: "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]", Icon: AlertCircle },
  success: { classes: "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]", Icon: CheckCircle2 },
  info: { classes: "border-[var(--color-border-strong)] bg-white/5 text-[var(--color-text-muted)]", Icon: Info },
};

export default function Alert({ tone = "info", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  const { classes, Icon } = toneConfig[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-start gap-2 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm", classes, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
