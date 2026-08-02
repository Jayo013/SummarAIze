import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  glow?: boolean;
  as?: "div" | "section" | "article";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, strong, glow, as: Comp = "div", ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        className={cn(
          "rounded-2xl p-5 sm:p-6",
          strong ? "glass-strong" : "glass",
          "shadow-[var(--shadow-md)]",
          glow && "shadow-[var(--shadow-glow)]",
          className
        )}
        {...(props as HTMLAttributes<HTMLDivElement>)}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";

export default GlassCard;
