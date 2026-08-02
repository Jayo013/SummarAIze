"use client";

import { motion } from "framer-motion";
import { Lock, ShieldCheck, UserCheck } from "lucide-react";
import Container from "../ui/Container";
import { fadeUp, stagger } from "../ui/motion";

const TRUST_POINTS = [
  { icon: UserCheck, label: "Authentication by Auth0" },
  { icon: Lock, label: "Encrypted in transit" },
  { icon: ShieldCheck, label: "You control what's shared" },
];

const PROVIDERS = ["Gemini", "Groq", "OpenAI"];

export default function TrustSection() {
  return (
    <section className="py-14 border-y border-[var(--color-border)] bg-white/[0.02]">
      <Container size="wide">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="flex flex-col items-center gap-8 text-center"
        >
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white/5 px-4 py-2 text-sm text-[var(--color-text-muted)]"
              >
                <Icon className="size-4 text-[var(--color-accent-2)]" aria-hidden="true" />
                {label}
              </span>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-faint)]">Powered by leading AI models</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {PROVIDERS.map((p) => (
                <span
                  key={p}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3.5 py-1.5 text-sm font-medium text-[var(--color-text)]"
                >
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
