import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-[var(--radius-md)] px-3.5 py-2.5 pr-9 text-sm outline-none transition-shadow cursor-pointer",
          "bg-white/[0.03] border border-[var(--color-border)] focus:border-[var(--color-accent)]/60",
          "focus:shadow-[0_0_0_3px_var(--color-accent-soft)]",
          "[color-scheme:dark]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-text-muted)]" />
    </div>
  );
});
Select.displayName = "Select";

export default Select;
