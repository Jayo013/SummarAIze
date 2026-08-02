import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "border-[var(--color-border-strong)] text-[var(--color-text-muted)] bg-white/5",
  accent: "border-[var(--color-accent)]/40 text-[color-mix(in_srgb,var(--color-accent-2)_80%,white)] bg-[var(--color-accent-soft)]",
  success: "border-[var(--color-success)]/40 text-[var(--color-success)] bg-[var(--color-success)]/10",
  warning: "border-[var(--color-warning)]/40 text-[var(--color-warning)] bg-[var(--color-warning)]/10",
  danger: "border-[var(--color-danger)]/40 text-[var(--color-danger)] bg-[var(--color-danger)]/10",
};

export default function Badge({
  children,
  tone = "neutral",
  className,
  title,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
