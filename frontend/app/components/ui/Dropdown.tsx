"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "./cn";

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  label,
  className,
  align = "left",
}: {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white/5 px-3.5 py-2 text-sm text-[var(--color-text)] hover:bg-white/10 transition-colors"
      >
        {label && <span className="text-[var(--color-text-muted)]">{label}</span>}
        <span className="font-medium">{current?.label ?? "Select…"}</span>
        <ChevronDown className={cn("size-4 text-[var(--color-text-muted)] transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-30 mt-2 min-w-[14rem] overflow-hidden rounded-[var(--radius-md)] glass-strong shadow-[var(--shadow-lg)] p-1",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition-colors",
                    opt.value === value ? "bg-white/10 text-white" : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
                  )}
                >
                  <Check className={cn("mt-0.5 size-3.5 shrink-0", opt.value === value ? "opacity-100 text-[var(--color-accent-2)]" : "opacity-0")} />
                  <span>
                    <span className="block">{opt.label}</span>
                    {opt.description && <span className="block text-xs text-[var(--color-text-faint)]">{opt.description}</span>}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
