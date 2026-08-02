"use client";

import { motion } from "framer-motion";
import { FileStack, MessagesSquare, ScanText, Share2, ShieldCheck, Sparkles } from "lucide-react";
import Container from "../ui/Container";
import GlassCard from "../ui/GlassCard";
import { fadeUp, stagger } from "../ui/motion";

const FEATURES = [
  {
    icon: ScanText,
    title: "Upload anything",
    description: "PDF, DOCX, or plain text — drop a file and we extract the content instantly.",
  },
  {
    icon: Sparkles,
    title: "7 summary styles",
    description: "Quick, detailed, study notes, executive, meeting minutes, key takeaways, or action items.",
  },
  {
    icon: FileStack,
    title: "Multi-provider AI",
    description: "Backed by Gemini, Groq, and OpenAI with automatic fallback so you always get an answer.",
  },
  {
    icon: MessagesSquare,
    title: "Chat with your summary",
    description: "Ask follow-up questions about any summary and get instant, grounded answers.",
  },
  {
    icon: Share2,
    title: "Share in one click",
    description: "Generate a read-only public link, or export straight to PDF or plain text.",
  },
  {
    icon: ShieldCheck,
    title: "Quality scoring",
    description: "Every summary is scored for accuracy and flagged if it needs a second look.",
  },
];

export default function Features() {
  return (
    <section className="py-20 sm:py-28">
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Built for how you actually read</h2>
          <p className="mt-3 text-[var(--color-text-muted)]">
            Every feature is designed to get you from a wall of text to a decision, faster.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <motion.div key={title} variants={fadeUp}>
              <GlassCard className="group h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
                <span className="inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-2)] transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-[var(--color-text)]">{title}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
