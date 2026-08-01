"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth0 } from "@auth0/auth0-react";
import { SUMMARY_MODE_LABELS, type SummaryMode } from "../summaryModes";

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

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="p-5 rounded-xl border border-white/10 bg-white/5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
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
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, apiBase, audience, getAccessTokenSilently]);

  const compressionLabel =
    stats?.avgCompressionRatio != null ? `${Math.round((1 - stats.avgCompressionRatio) * 100)}% shorter` : "—";

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/" className="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/40 transition">
          ← Back to Summarizer
        </Link>
      </div>

      {authLoading || loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !isAuthenticated ? (
        <div className="p-5 rounded-xl border border-white/10 bg-white/5 space-y-3">
          <p className="text-sm text-gray-400">Log in to see your summary stats.</p>
          <button
            className="px-3 py-1.5 rounded border border-white/20 hover:border-white/40 transition text-sm"
            onClick={() => loginWithRedirect({ authorizationParams: { audience, prompt: "login" } })}
          >
            Login
          </button>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Summaries" value={String(stats?.totalSummaries ?? 0)} />
            <StatCard label="Total Words Processed" value={(stats?.totalWordsProcessed ?? 0).toLocaleString()} />
            <StatCard label="Avg. Compression" value={compressionLabel} hint="How much shorter summaries are vs. the original text" />
            <StatCard label="Most Used AI Model" value={stats?.mostUsedModel ?? "—"} />
          </div>

          <section className="p-5 rounded-xl border border-white/10 bg-white/5 space-y-3">
            <h2 className="text-lg font-semibold">Activity History</h2>
            {stats?.recentActivity.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-white/10">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Mode</th>
                      <th className="py-2 pr-4">Provider</th>
                      <th className="py-2 pr-4">Words (in → out)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity.map((item) => (
                      <tr key={item.id} className="border-b border-white/5">
                        <td className="py-2 pr-4 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                        <td className="py-2 pr-4">{modeLabel(item.mode)}</td>
                        <td className="py-2 pr-4">{item.model ?? item.provider}</td>
                        <td className="py-2 pr-4">
                          {item.inputWordCount.toLocaleString()} → {item.outputWordCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No summaries yet. Go summarize something!</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
