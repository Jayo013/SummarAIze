"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Button from "../ui/Button";
import Container from "../ui/Container";

export default function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="py-20 sm:py-28">
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[var(--radius-2xl)] px-6 py-16 text-center sm:px-12"
          style={{
            background: "linear-gradient(135deg, rgba(124,92,255,0.25), rgba(34,211,238,0.18))",
          }}
        >
          <div className="glass-strong absolute inset-0 -z-10" aria-hidden="true" />
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Ready to read less and know more?</h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--color-text-muted)]">
            Sign in and summarize your first document in under a minute.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={onGetStarted}>
              Get started free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
