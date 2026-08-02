"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export default function FAB({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={cn(
        "fixed bottom-5 right-5 z-40 flex size-13 items-center justify-center rounded-full lg:hidden",
        "bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] text-white shadow-[var(--shadow-glow)]",
        className
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </motion.button>
  );
}
