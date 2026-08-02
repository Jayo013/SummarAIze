"use client";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { SUMMARY_MODES, SUMMARY_MODE_LABELS, type SummaryMode } from "../summaryModes";
import Navbar from "../components/ui/Navbar";
import Container from "../components/ui/Container";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Alert from "../components/ui/Alert";
import { getErrorMessage } from "../lib/errors";

interface Settings {
  preferredProvider: string | null;
  preferredMode: string;
  preferredExportFormat: string;
}

const PROVIDER_OPTIONS = [
  { label: "Auto (best available)", value: "" },
  { label: "Gemini", value: "gemini" },
  { label: "Groq", value: "groq" },
  { label: "OpenAI", value: "openai" },
];

const EXPORT_OPTIONS = [
  { label: "Plain text (.txt)", value: "txt" },
  { label: "PDF (.pdf)", value: "pdf" },
];

function SettingRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <p className="text-xs text-[var(--color-text-faint)]">{hint}</p>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently, loginWithRedirect } = useAuth0();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE ?? "";

  async function getToken() {
    return getAccessTokenSilently({ authorizationParams: { audience } });
  }

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
        const res = await fetch(`${apiBase}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        if (!cancelled) setSettings(data);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load settings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, apiBase]);

  async function save(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          preferredProvider: next.preferredProvider || null,
          preferredMode: next.preferredMode,
          preferredExportFormat: next.preferredExportFormat,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save settings.");
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save settings."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <Container size="narrow" className="py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Tune your default summarization preferences.</p>
        </div>

        {authLoading || loading ? (
          <div className="py-10 text-sm text-[var(--color-text-muted)]">Loading…</div>
        ) : !isAuthenticated ? (
          <GlassCard className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">Log in to manage your preferences.</p>
            <Button size="sm" onClick={() => loginWithRedirect({ authorizationParams: { audience, prompt: "login" } })}>
              Login
            </Button>
          </GlassCard>
        ) : error ? (
          <Alert tone="danger">{error}</Alert>
        ) : settings ? (
          <GlassCard className="space-y-7">
            <SettingRow label="Preferred AI provider" hint="Tried first when summarizing. If it's unavailable, we automatically fall back to the others.">
              <Select value={settings.preferredProvider ?? ""} onChange={(e) => save({ preferredProvider: e.target.value || null })} disabled={saving}>
                {PROVIDER_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </SettingRow>

            <SettingRow label="Preferred summary style" hint="Pre-selected by default on the summarizer page.">
              <Select value={settings.preferredMode} onChange={(e) => save({ preferredMode: e.target.value })} disabled={saving}>
                {SUMMARY_MODES.map((m: SummaryMode) => (
                  <option key={m} value={m}>
                    {SUMMARY_MODE_LABELS[m]}
                  </option>
                ))}
              </Select>
            </SettingRow>

            <SettingRow label="Preferred export format" hint='Used by the primary "Download" button on a finished summary.'>
              <Select value={settings.preferredExportFormat} onChange={(e) => save({ preferredExportFormat: e.target.value })} disabled={saving}>
                {EXPORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </SettingRow>

            <div className="h-5">
              <AnimatePresence mode="wait">
                {saving ? (
                  <motion.p key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-[var(--color-text-faint)]">
                    Saving…
                  </motion.p>
                ) : saved ? (
                  <motion.p
                    key="saved"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-success)]"
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    Saved
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          </GlassCard>
        ) : null}
      </Container>
    </main>
  );
}
