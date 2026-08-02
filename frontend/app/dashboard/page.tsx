"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth0 } from "@auth0/auth0-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { FileText, Gauge, History as HistoryIcon, LayoutDashboard, Plus, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { SUMMARY_MODE_LABELS, type SummaryMode } from "../summaryModes";
import Navbar from "../components/ui/Navbar";
import Container from "../components/ui/Container";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import { fadeUp, stagger } from "../components/ui/motion";
import { getErrorMessage } from "../lib/errors";

interface ActivityItem {
  id: string;
  mode: string;
  provider: string;
  model: string | null;
  inputWordCount: number;
  outputWordCount: number;
  createdAt: string;
}

interface DashboardStats {
  totalSummaries: number;
  totalWordsProcessed: number;
  avgCompressionRatio: number | null;
  mostUsedModel: string | null;
  recentActivity: ActivityItem[];
}

function CountUp({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    const unsubscribe = rounded.on("change", setDisplay);
    return () => {
      controls.stop();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display}</>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  numeric,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  hint?: string;
  numeric?: number;
}) {
  return (
    <motion.div variants={fadeUp}>
      <GlassCard className="h-full">
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <Icon className="size-4" aria-hidden="true" />
          <p className="text-sm">{label}</p>
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {numeric !== undefined ? <CountUp value={numeric} /> : value}
        </p>
        {hint && <p className="mt-1 text-xs text-[var(--color-text-faint)]">{hint}</p>}
      </GlassCard>
    </motion.div>
  );
}

function modeLabel(mode: string): string {
  return SUMMARY_MODE_LABELS[mode as SummaryMode] ?? mode;
}

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE ?? "";

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAccessTokenSilently({ authorizationParams: { audience } });
        const res = await fetch(`${apiBase}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        if (!cancelled) setStats(data);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load dashboard."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, apiBase, audience, getAccessTokenSilently]);

  const compressionPct =
    stats?.avgCompressionRatio != null ? Math.round((1 - stats.avgCompressionRatio) * 100) : null;

  return (
    <main className="min-h-screen">
      <Navbar />
      <Container size="wide" className="py-8 sm:py-10">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Your summarization activity at a glance.</p>
          </div>
        </div>

        {authLoading || loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <GlassCard key={i}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16 mt-3" />
              </GlassCard>
            ))}
          </div>
        ) : !isAuthenticated ? (
          <GlassCard className="max-w-md space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">Log in to see your summary stats.</p>
            <Button size="sm" onClick={() => loginWithRedirect({ authorizationParams: { audience, prompt: "login" } })}>
              Login
            </Button>
          </GlassCard>
        ) : error ? (
          <Alert tone="danger">{error}</Alert>
        ) : (
          <>
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard icon={FileText} label="Total Summaries" numeric={stats?.totalSummaries ?? 0} value={String(stats?.totalSummaries ?? 0)} />
              <StatCard
                icon={LayoutDashboard}
                label="Words Processed"
                numeric={stats?.totalWordsProcessed ?? 0}
                value={(stats?.totalWordsProcessed ?? 0).toLocaleString()}
              />
              <StatCard
                icon={Gauge}
                label="Avg. Compression"
                value={compressionPct !== null ? `${compressionPct}%` : "—"}
                hint="How much shorter summaries are vs. the original text"
              />
              <StatCard icon={Sparkles} label="Most Used AI Model" value={stats?.mostUsedModel ?? "—"} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 flex flex-wrap gap-3">
              <Link href="/">
                <Button size="sm">
                  <Plus className="size-3.5" aria-hidden="true" />
                  New Summary
                </Button>
              </Link>
              <Link href="/history">
                <Button size="sm" variant="outline">
                  <HistoryIcon className="size-3.5" aria-hidden="true" />
                  View History
                </Button>
              </Link>
              <Link href="/settings">
                <Button size="sm" variant="outline">
                  <SettingsIcon className="size-3.5" aria-hidden="true" />
                  Settings
                </Button>
              </Link>
            </motion.div>

            <GlassCard className="mt-6">
              <h2 className="text-lg font-semibold mb-3">Activity History</h2>
              {stats?.recentActivity.length ? (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-text-faint)] border-b border-[var(--color-border)]">
                        <th className="py-2 px-1 font-medium">Date</th>
                        <th className="py-2 px-1 font-medium">Mode</th>
                        <th className="py-2 px-1 font-medium">Provider</th>
                        <th className="py-2 px-1 font-medium">Words (in → out)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentActivity.map((item) => (
                        <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-white/[0.03] transition-colors">
                          <td className="py-2.5 px-1 whitespace-nowrap text-[var(--color-text-muted)]">
                            {new Date(item.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-1">
                            <Badge>{modeLabel(item.mode)}</Badge>
                          </td>
                          <td className="py-2.5 px-1 whitespace-nowrap">{item.model ?? item.provider}</td>
                          <td className="py-2.5 px-1 whitespace-nowrap text-[var(--color-text-muted)]">
                            {item.inputWordCount.toLocaleString()} → {item.outputWordCount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">No summaries yet. Go summarize something!</p>
              )}
            </GlassCard>
          </>
        )}
      </Container>
    </main>
  );
}
