import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, invalid, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-lg)] p-4 text-sm leading-relaxed outline-none resize-none transition-shadow",
        "bg-white/[0.03] border",
        invalid ? "border-[var(--color-danger)]" : "border-[var(--color-border)] focus:border-[var(--color-accent)]/60",
        "focus:shadow-[0_0_0_3px_var(--color-accent-soft)]",
        "placeholder:text-[var(--color-text-faint)]",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export default Textarea;
