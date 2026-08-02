"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Search, X } from "lucide-react";
import { SUMMARY_MODES, SUMMARY_MODE_LABELS, type SummaryMode } from "../summaryModes";
import ShareButton from "../components/ShareButton";
import ChatPanel from "../components/ChatPanel";
import QualityBadge from "../components/QualityBadge";
import Navbar from "../components/ui/Navbar";
import Container from "../components/ui/Container";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Alert from "../components/ui/Alert";
import { getErrorMessage } from "../lib/errors";
import Skeleton from "../components/ui/Skeleton";
import Badge from "../components/ui/Badge";

interface HistoryItem {
  id: string;
  mode: string;
  provider: string;
  model: string | null;
  inputWordCount: number;
  outputWordCount: number;
  preview: string;
  createdAt: string;
  qualityScore: number | null;
  qualityFlags: string[];
}

interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 10;
const DEBOUNCE_MS = 400;

function modeLabel(mode: string): string {
  return SUMMARY_MODE_LABELS[mode as SummaryMode] ?? mode;
}

export default function History() {
  const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently, loginWithRedirect } = useAuth0();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mode, setMode] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);

  const [providers, setProviders] = useState<string[]>([]);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE ?? "";

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, mode, provider, dateFrom, dateTo]);

  const getToken = useCallback(async () => {
    return getAccessTokenSilently({ authorizationParams: { audience } });
  }, [getAccessTokenSilently, audience]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !apiBase) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${apiBase}/summaries/providers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && !cancelled) setProviders(json.providers ?? []);
      } catch {
        /* non-critical: filter dropdown just stays empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, apiBase, getToken]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (mode) params.set("mode", mode);
    if (provider) params.set("provider", provider);
    if (dateFrom) params.set("dateFrom", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      params.set("dateTo", end.toISOString());
    }
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    return params.toString();
  }, [debouncedSearch, mode, provider, dateFrom, dateTo, page]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
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
        const token = await getToken();
        const res = await fetch(`${apiBase}/summaries?${queryString}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
        if (!cancelled) setData(json);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load summary history."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, apiBase, queryString, getToken]);

  const hasFilters = Boolean(debouncedSearch || mode || provider || dateFrom || dateTo);

  function clearFilters() {
    setSearch("");
    setMode("");
    setProvider("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <Container size="wide" className="py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Search and revisit everything you&apos;ve summarized.</p>
        </div>

        {authLoading ? (
          <div className="py-10 text-sm text-[var(--color-text-muted)]">Loading…</div>
        ) : !isAuthenticated ? (
          <GlassCard className="max-w-md space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">Log in to search your summary history.</p>
            <Button size="sm" onClick={() => loginWithRedirect({ authorizationParams: { audience, prompt: "login" } })}>
              Login
            </Button>
          </GlassCard>
        ) : (
          <>
            <GlassCard className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--color-text-faint)]" aria-hidden="true" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search summaries…"
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="">All modes</option>
                  {SUMMARY_MODES.map((m) => (
                    <option key={m} value={m}>
                      {SUMMARY_MODE_LABELS[m]}
                    </option>
                  ))}
                </Select>
                <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
                  <option value="">All providers</option>
                  {providers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo || undefined}
                  aria-label="From date"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  aria-label="To date"
                />
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]">
                  <X className="size-3" aria-hidden="true" />
                  Clear filters
                </button>
              )}
            </GlassCard>

            {loading ? (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <Alert tone="danger" className="mt-4">
                {error}
              </Alert>
            ) : !data?.items.length ? (
              <p className="mt-6 text-sm text-[var(--color-text-muted)]">
                {hasFilters ? "No summaries match your filters." : "No summaries yet. Go summarize something!"}
              </p>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] glass">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-text-faint)] border-b border-[var(--color-border)] bg-white/[0.03]">
                        <th className="py-2.5 px-4 font-medium">Date</th>
                        <th className="py-2.5 px-4 font-medium">Mode</th>
                        <th className="py-2.5 px-4 font-medium">Provider</th>
                        <th className="py-2.5 px-4 font-medium">Words</th>
                        <th className="py-2.5 px-4 font-medium">Quality</th>
                        <th className="py-2.5 px-4 font-medium">Preview</th>
                        <th className="py-2.5 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item) => (
                        <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0 align-top hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-[var(--color-text-muted)]">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge>{modeLabel(item.mode)}</Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">{item.model ?? item.provider}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-[var(--color-text-muted)]">
                            {item.inputWordCount.toLocaleString()} → {item.outputWordCount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {item.qualityScore !== null ? (
                              <QualityBadge score={item.qualityScore} flags={item.qualityFlags} />
                            ) : (
                              <span className="text-[var(--color-text-faint)]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[var(--color-text-muted)] max-w-md">{item.preview}</td>
                          <td className="py-3 px-4 space-y-2">
                            <ShareButton summaryId={item.id} apiBase={apiBase} getToken={getToken} />
                            <ChatPanel summaryId={item.id} apiBase={apiBase} getToken={getToken} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">
                    {data.total.toLocaleString()} result{data.total === 1 ? "" : "s"} · page {data.page} of{" "}
                    {Math.max(data.totalPages, 1)}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => (data.totalPages > p ? p + 1 : p))}
                      disabled={page >= data.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </Container>
    </main>
  );
}
