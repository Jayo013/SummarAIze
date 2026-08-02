"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Container from "../ui/Container";
import { fadeUp, stagger } from "../ui/motion";

export default function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50rem 26rem at 50% -10%, rgba(124,92,255,0.22), transparent 60%), radial-gradient(36rem 20rem at 85% 10%, rgba(34,211,238,0.14), transparent 60%)",
        }}
      />
      <Container size="wide">
        <motion.div initial="hidden" animate="show" variants={stagger} className="mx-auto max-w-3xl text-center">
          <motion.div variants={fadeUp}>
            <Badge tone="accent" icon={<Sparkles className="size-3" />}>
              Multi-model AI summarization
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.08]">
            Turn long documents into
            <br />
            <span className="text-gradient">clarity, in seconds.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-balance text-base sm:text-lg text-[var(--color-text-muted)]">
            Paste your notes or upload a PDF, DOCX, or TXT file. SummarAIze reads it, understands it, and
            gives you exactly the kind of summary you need — quick, detailed, study notes, or action items.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={onGetStarted}>
              Get started free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
            >
              See it in action
            </Button>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-6 text-xs text-[var(--color-text-faint)]">
            No credit card required · Secured with Auth0
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}
