"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SUMMARY_MODE_LABELS, type SummaryMode } from "../../summaryModes";
import Navbar from "../../components/ui/Navbar";
import Container from "../../components/ui/Container";
import GlassCard from "../../components/ui/GlassCard";
import Badge from "../../components/ui/Badge";
import Alert from "../../components/ui/Alert";
import Skeleton from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import { getErrorMessage } from "../../lib/errors";

interface PublicShare {
  summary: string;
  mode: string;
  provider: string;
  model: string | null;
  createdAt: string;
  expiresAt: string | null;
}

function modeLabel(mode: string): string {
  return SUMMARY_MODE_LABELS[mode as SummaryMode] ?? mode;
}

export default function SharedSummaryPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [data, setData] = useState<PublicShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "";

  useEffect(() => {
    if (!token) return;
    if (!apiBase) {
      setError("Missing NEXT_PUBLIC_API_BASE in .env.local.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/share/${token}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error || "This link doesn't exist or has expired.");
        }
        if (!cancelled) setData(json);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load shared summary."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, apiBase]);

  return (
    <main className="min-h-screen">
      <Navbar />
      <Container size="narrow" className="py-10 sm:py-14">
        {loading ? (
          <GlassCard className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </GlassCard>
        ) : error ? (
          <Alert tone="danger">{error}</Alert>
        ) : data ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <GlassCard glow className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold">{modeLabel(data.mode)}</h1>
                <Badge>{data.model ?? data.provider}</Badge>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-[var(--color-text)]">{data.summary}</p>
              <p className="text-xs text-[var(--color-text-faint)] pt-3 border-t border-[var(--color-border)]">
                Shared {new Date(data.createdAt).toLocaleDateString()}
                {data.expiresAt ? ` · Link expires ${new Date(data.expiresAt).toLocaleDateString()}` : ""}
              </p>
            </GlassCard>

            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">This is a read-only public view — no login required.</p>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Try SummarAIze yourself
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : null}
      </Container>
    </main>
  );
}
