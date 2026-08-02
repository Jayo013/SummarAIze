"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import Container from "../ui/Container";
import GlassCard from "../ui/GlassCard";
import Tabs from "../ui/Tabs";

const SOURCE_TEXT = `Quarterly planning meeting notes: The team reviewed Q3 performance across all product lines. Revenue grew 14% year over year, driven primarily by the enterprise tier. Customer churn increased slightly in the SMB segment, attributed to onboarding friction identified in support tickets. The engineering team flagged technical debt in the billing service as a growing risk to release velocity. Marketing proposed a refreshed positioning strategy for Q4 focused on mid-market accounts. Action was requested from product to prioritize a self-serve onboarding flow, and from engineering to scope a billing service refactor before the next major release.`;

const DEMO_MODES = [
  {
    value: "quick",
    label: "Quick Summary",
    output: [
      "Q3 revenue up 14% YoY, led by enterprise tier.",
      "SMB churn rising due to onboarding friction.",
      "Billing service technical debt is a release risk.",
      "Q4 focus: mid-market positioning + self-serve onboarding.",
    ],
  },
  {
    value: "action_items",
    label: "Action Items",
    output: [
      "Product: prioritize self-serve onboarding flow.",
      "Engineering: scope billing service refactor before next release.",
      "Marketing: draft Q4 mid-market positioning strategy.",
      "Support: audit onboarding friction points driving SMB churn.",
    ],
  },
  {
    value: "executive",
    label: "Executive Summary",
    output: [
      "Strong Q3 driven by enterprise growth (+14% YoY).",
      "SMB retention needs attention; onboarding is the root cause.",
      "Technical debt in billing threatens future velocity.",
      "Q4 strategy pivots toward mid-market expansion.",
    ],
  },
];

export default function DemoSection() {
  const [mode, setMode] = useState(DEMO_MODES[0].value);
  const active = DEMO_MODES.find((m) => m.value === mode) ?? DEMO_MODES[0];

  return (
    <section id="demo" className="py-20 sm:py-28">
      <Container size="wide">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">See the transformation</h2>
          <p className="mt-3 text-[var(--color-text-muted)]">
            The same meeting notes, turned into three different summary styles.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Tabs items={DEMO_MODES} value={mode} onChange={setMode} layoutId="demo-tabs" />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_1fr] items-center">
          <GlassCard>
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-faint)]">
              <FileText className="size-3.5" aria-hidden="true" />
              ORIGINAL NOTES
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)] line-clamp-[10]">{SOURCE_TEXT}</p>
          </GlassCard>

          <div className="flex justify-center rotate-90 lg:rotate-0 text-[var(--color-text-faint)]">
            <ArrowRight className="size-5" aria-hidden="true" />
          </div>

          <GlassCard glow className="relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-accent-2)]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {active.label.toUpperCase()}
            </div>
            <AnimatePresence mode="wait">
              <motion.ul
                key={mode}
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                className="mt-3 space-y-2"
              >
                {active.output.map((line, i) => (
                  <motion.li
                    key={i}
                    variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text)]"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--color-accent-2)]" />
                    {line}
                  </motion.li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </GlassCard>
        </div>
      </Container>
    </section>
  );
}
