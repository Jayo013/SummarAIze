"use client";

import { motion } from "framer-motion";
import { cn } from "./cn";

export interface TabItem {
  value: string;
  label: string;
}

export default function Tabs({
  items,
  value,
  onChange,
  layoutId = "tabs-underline",
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  layoutId?: string;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
              active ? "text-white" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] shadow-[var(--shadow-glow)]"
              />
            )}
            <span className="relative">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
