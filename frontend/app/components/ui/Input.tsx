import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-md)] px-3.5 py-2.5 text-sm outline-none transition-shadow",
        "bg-white/[0.03] border border-[var(--color-border)] focus:border-[var(--color-accent)]/60",
        "focus:shadow-[0_0_0_3px_var(--color-accent-soft)]",
        "placeholder:text-[var(--color-text-faint)]",
        "[color-scheme:dark]",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export default Input;
