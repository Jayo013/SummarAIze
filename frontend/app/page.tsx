"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { SUMMARY_MODES, type SummaryMode } from "./summaryModes";
import Navbar from "./components/ui/Navbar";
import Container from "./components/ui/Container";
import WorkspaceInput from "./components/WorkspaceInput";
import WorkspaceOutput from "./components/WorkspaceOutput";
import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import TrustSection from "./components/landing/TrustSection";
import DemoSection from "./components/landing/DemoSection";
import CTASection from "./components/landing/CTASection";
import Footer from "./components/landing/Footer";
import Alert from "./components/ui/Alert";
import { getErrorMessage } from "./lib/errors";

const MAX_CHARS = 20000;
const LS_TEXT = "summarize:text";
const LS_RESUME = "summarize:resume";
const LS_MODE = "summarize:mode";

interface RemoteSettings {
  preferredProvider: string | null;
  preferredMode: string;
  preferredExportFormat: string;
}

export default function Home() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<SummaryMode>("quick");
  const [summary, setSummary] = useState("");
  const [summaryProvider, setSummaryProvider] = useState("");
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [qualityFlags, setQualityFlags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [preferredExportFormat, setPreferredExportFormat] = useState<"txt" | "pdf">("txt");
  const [remoteSettings, setRemoteSettings] = useState<RemoteSettings | null>(null);

  const {
    isAuthenticated,
    isLoading: authLoading,
    loginWithRedirect,
    getAccessTokenSilently,
    error: authError,
  } = useAuth0();

  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE ?? "";

  // ------- Export helpers -------
  function downloadTxt(contents: string) {
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadPdf(contents: string) {
    const { jsPDF } = await import("jspdf"); // safe for Next/SSR
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const marginX = 48;
    let y = 64;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SummarAIze — Summary", marginX, y);
    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y);
    y += 20;

    doc.setTextColor(0);
    doc.setFontSize(12);
    const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
    const pageBottom = doc.internal.pageSize.getHeight() - 64;
    const lineHeight = 16;

    const lines = doc.splitTextToSize(contents, maxWidth);
    for (const line of lines) {
      if (y > pageBottom) {
        doc.addPage();
        y = 64;
      }
      doc.text(line, marginX, y);
      y += lineHeight;
    }

    doc.save(`summary-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async function shareSummary(contents: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title: "SummarAIze — Summary", text: contents });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(contents);
      alert("Summary copied to clipboard.");
    }
  }
  // -------------------------------

  // Restore textarea and mode after redirects
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LS_TEXT);
    if (saved) setText(saved);
    const savedMode = localStorage.getItem(LS_MODE) as SummaryMode | null;
    if (savedMode && SUMMARY_MODES.includes(savedMode)) setMode(savedMode);
  }, []);

  // Auto-resume summarize after returning from Auth0
  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldResume = localStorage.getItem(LS_RESUME) === "1";
    if (isAuthenticated && shouldResume && text.trim()) {
      localStorage.removeItem(LS_RESUME);
      void doSummarize(text.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Apply saved preferences: preferred mode only fills in when the user has no
  // locally-remembered mode yet, so it never overrides an in-session choice.
  useEffect(() => {
    if (authLoading || !isAuthenticated || !apiBase) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getApiToken();
        const res = await fetch(`${apiBase}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;

        setRemoteSettings({
          preferredProvider: data?.preferredProvider ?? null,
          preferredMode: SUMMARY_MODES.includes(data?.preferredMode) ? data.preferredMode : "quick",
          preferredExportFormat: data?.preferredExportFormat === "pdf" ? "pdf" : "txt",
        });

        if (typeof data?.preferredExportFormat === "string") {
          setPreferredExportFormat(data.preferredExportFormat === "pdf" ? "pdf" : "txt");
        }

        const hasLocalMode = typeof window !== "undefined" && localStorage.getItem(LS_MODE);
        if (!hasLocalMode && SUMMARY_MODES.includes(data?.preferredMode)) {
          setMode(data.preferredMode);
        }
      } catch {
        /* non-critical: summarizer still works with hardcoded defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, apiBase]);

  async function getApiToken(): Promise<string> {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience },
      });
      if (!token) throw new Error("No access token");
      return token;
    } catch (e: unknown) {
      const errObj = e as { error?: string; code?: string } | undefined;
      const code = String(errObj?.error || errObj?.code || "").toLowerCase();
      if (
        code.includes("login_required") ||
        code.includes("consent_required") ||
        code.includes("interaction_required")
      ) {
        if (typeof window !== "undefined") {
          localStorage.setItem(LS_RESUME, "1");
          localStorage.setItem(LS_TEXT, text);
        }
        await loginWithRedirect({
          authorizationParams: { audience, prompt: "login" },
        });
      }
      throw e;
    }
  }

  // Updates just the preferred provider, echoing back the rest of the settings
  // object exactly as last fetched so we never clobber preferredMode/export format.
  async function updatePreferredProvider(value: string) {
    if (!remoteSettings || !apiBase) return;
    const next = { ...remoteSettings, preferredProvider: value || null };
    setRemoteSettings(next);
    try {
      const token = await getApiToken();
      const res = await fetch(`${apiBase}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRemoteSettings({
          preferredProvider: data?.preferredProvider ?? null,
          preferredMode: SUMMARY_MODES.includes(data?.preferredMode) ? data.preferredMode : "quick",
          preferredExportFormat: data?.preferredExportFormat === "pdf" ? "pdf" : "txt",
        });
        setPreferredExportFormat(data?.preferredExportFormat === "pdf" ? "pdf" : "txt");
      }
    } catch {
      /* non-critical: preference just won't persist this time */
    }
  }

  async function doSummarize(trimmed: string) {
    if (!apiBase) {
      setError(
        "Missing NEXT_PUBLIC_API_BASE in .env.local (e.g. http://localhost:4000/api). Restart dev server after adding."
      );
      return;
    }

    setLoading(true);
    setSummary("");
    setSummaryProvider("");
    setSummaryId(null);
    setQualityScore(null);
    setQualityFlags([]);
    setError(null);

    try {
      const token = await getApiToken();
      const res = await fetch(`${apiBase}/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: trimmed, mode }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data?.detail as string) ||
          (data?.error as string) ||
          `Request failed (${res.status})`;
        throw new Error(msg);
      }
      setSummary(typeof data?.summary === "string" ? data.summary : "");
      setSummaryProvider(typeof data?.provider === "string" ? data.provider : "");
      setSummaryId(typeof data?.id === "string" ? data.id : null);
      setQualityScore(typeof data?.qualityScore === "number" ? data.qualityScore : null);
      setQualityFlags(Array.isArray(data?.qualityFlags) ? data.qualityFlags : []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to summarize."));
    } finally {
      setLoading(false);
    }
  }

  const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

  async function handleFile(file: File) {
    setUploadNotice(null);
    setError(null);

    const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Unsupported file type. Only PDF, DOCX, and TXT are allowed.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }
    if (!apiBase) {
      setError("Missing NEXT_PUBLIC_API_BASE in .env.local.");
      return;
    }

    setUploading(true);
    try {
      const token = await getApiToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiBase}/documents/extract`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data?.error as string) || `Upload failed (${res.status})`);
      }

      const extracted = typeof data?.text === "string" ? data.text : "";
      setText(extracted);
      if (typeof window !== "undefined") localStorage.setItem(LS_TEXT, extracted);
      setUploadNotice(
        data?.truncated
          ? `Loaded "${data.fileName}" — text was truncated to ${MAX_CHARS.toLocaleString()} characters.`
          : `Loaded "${data.fileName}" (${data.charCount.toLocaleString()} characters).`
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to extract text from file."));
    } finally {
      setUploading(false);
    }
  }

  async function handleSummarize(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_CHARS) {
      setError(`Input is too long (${trimmed.length} chars). Max is ${MAX_CHARS}.`);
      return;
    }
    await doSummarize(trimmed);
  }

  function handleGetStarted() {
    loginWithRedirect({ authorizationParams: { audience, prompt: "login" } });
  }

  // Default to the marketing landing page whenever we don't yet have a confirmed,
  // authenticated session (including while Auth0 is still resolving) — this avoids a
  // blank "Loading…" flash for the common case of an anonymous visitor, since
  // isAuthenticated only ever flips true once authLoading has already settled to false.
  if (!isAuthenticated) {
    return (
      <main>
        <Navbar />
        <Hero onGetStarted={handleGetStarted} />
        <Features />
        <TrustSection />
        <DemoSection />
        <CTASection onGetStarted={handleGetStarted} />
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <Container size="wide" className="py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Summarize</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Paste your notes, or drop a document, and choose a style below.
          </p>
        </div>

        {authError && (
          <Alert tone="danger" className="mb-4">
            Auth error: {String(authError.message || authError)}
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <div className="lg:sticky lg:top-24">
            <WorkspaceInput
              mode={mode}
              onModeChange={(m) => {
                setMode(m);
                if (typeof window !== "undefined") localStorage.setItem(LS_MODE, m);
              }}
              text={text}
              onTextChange={(v) => {
                setText(v);
                if (typeof window !== "undefined") localStorage.setItem(LS_TEXT, v);
              }}
              uploading={uploading}
              uploadNotice={uploadNotice}
              onFile={handleFile}
              onSubmit={handleSummarize}
              loading={loading}
              preferredProvider={remoteSettings?.preferredProvider ?? null}
              onPreferredProviderChange={updatePreferredProvider}
            />
          </div>

          <WorkspaceOutput
            loading={loading}
            summary={summary}
            summaryProvider={summaryProvider}
            summaryId={summaryId}
            mode={mode}
            qualityScore={qualityScore}
            qualityFlags={qualityFlags}
            error={error}
            isAuthenticated={isAuthenticated}
            apiBase={apiBase}
            getToken={getApiToken}
            preferredExportFormat={preferredExportFormat}
            onDownloadPreferred={() =>
              preferredExportFormat === "pdf" ? downloadPdf(summary) : downloadTxt(summary)
            }
            onDownloadTxt={() => downloadTxt(summary)}
            onDownloadPdf={() => downloadPdf(summary)}
            onShare={() => shareSummary(summary)}
          />
        </div>
      </Container>
    </main>
  );
}
