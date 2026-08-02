"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const STATUS_MESSAGES = [
  "Reading your document…",
  "Identifying key points…",
  "Structuring the summary…",
  "Polishing the output…",
];

export default function AIThinking({ className }: { className?: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STATUS_MESSAGES.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-12 text-center ${className ?? ""}`}>
      <div className="relative flex size-14 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] opacity-30 blur-xl animate-pulse" />
        <span className="relative flex size-14 items-center justify-center rounded-full glass-strong shadow-[var(--shadow-glow)]">
          <Sparkles className="size-6 text-[var(--color-accent-2)]" aria-hidden="true" />
        </span>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-[var(--color-accent-2)]"
            style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.15}s infinite` }}
          />
        ))}
      </div>
      <p role="status" aria-live="polite" className="text-sm text-[var(--color-text-muted)]">
        {STATUS_MESSAGES[step]}
      </p>
    </div>
  );
}
