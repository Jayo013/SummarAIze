"use client";
import { useEffect, useState, FormEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { SUMMARY_MODES, SUMMARY_MODE_LABELS, type SummaryMode } from "./summaryModes";

const MAX_CHARS = 20000;
const LS_TEXT = "summarize:text";
const LS_RESUME = "summarize:resume";
const LS_MODE = "summarize:mode";

export default function Home() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<SummaryMode>("quick");
  const [summary, setSummary] = useState("");
  const [summaryProvider, setSummaryProvider] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const {
    isAuthenticated,
    isLoading: authLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
    user,
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

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SummarAIze — Summary", marginX, y);
    y += 24;

    // Meta
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y);
    y += 20;

    // Body
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

  async function getApiToken(): Promise<string> {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience },
      });
      if (!token) throw new Error("No access token");
      return token;
    } catch (e: any) {
      const code = String(e?.error || e?.code || "").toLowerCase();
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

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg =
          (data?.detail as string) ||
          (data?.error as string) ||
          `Request failed (${res.status})`;
        throw new Error(msg);
      }
      setSummary(typeof data?.summary === "string" ? data.summary : "");
      setSummaryProvider(typeof data?.provider === "string" ? data.provider : "");
    } catch (err: any) {
      setError(err?.message || "Failed to summarize.");
    } finally {
      setLoading(false);
    }
  }

  const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

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

      const data = await res.json().catch(() => ({} as any));
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
    } catch (err: any) {
      setError(err?.message || "Failed to extract text from file.");
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

  const chars = text.length;
  const tooLong = chars > MAX_CHARS;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header with Login/Logout */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">SummarAIze</h1>
        <div className="text-sm flex items-center gap-3">
          {authLoading ? (
            <span>Auth…</span>
          ) : isAuthenticated ? (
            <>
              <span className="opacity-70">{user?.name || user?.email}</span>
              <button
                className="px-3 py-1 rounded border"
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="px-3 py-1 rounded border"
              onClick={() =>
                loginWithRedirect({
                  authorizationParams: { audience, prompt: "login" },
                })
              }
            >
              Login
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-400">Paste your notes and click Summarize.</p>

      <form onSubmit={handleSummarize} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {SUMMARY_MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                if (typeof window !== "undefined") localStorage.setItem(LS_MODE, m);
              }}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                mode === m
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-white/20 text-gray-300 hover:border-white/40"
              }`}
              aria-pressed={mode === m}
            >
              {SUMMARY_MODE_LABELS[m]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label
            className={`px-3 py-1.5 rounded-lg border border-white/20 cursor-pointer hover:border-white/40 transition ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploading ? "Reading file…" : "Upload document (.pdf, .docx, .txt)"}
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileChange} disabled={uploading} />
          </label>
          {uploadNotice && <span className="text-gray-400">{uploadNotice}</span>}
        </div>
        <textarea
          className={`w-full h-48 p-3 rounded border outline-none ${
            tooLong ? "border-red-500" : "border-white/20 bg-black/40"
          } focus:ring-2 focus:ring-blue-600`}
          placeholder="Paste your notes here…"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (typeof window !== "undefined")
              localStorage.setItem(LS_TEXT, e.target.value);
          }}
          aria-invalid={tooLong}
          aria-describedby="charHelp"
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span id="charHelp">
            {tooLong ? (
              <span className="text-red-500 font-semibold">
                {chars.toLocaleString()} / {MAX_CHARS.toLocaleString()} (too long)
              </span>
            ) : (
              <span>
                {chars.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            )}
          </span>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50 hover:bg-blue-500 transition"
            disabled={!text.trim() || loading || tooLong}
          >
            {loading ? "Summarizing…" : "Summarize"}
          </button>
        </div>
      </form>

      {authError && (
        <p className="text-sm text-red-500">
          Auth error: {String(authError.message || authError)}
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {summary && (
        <section className="p-5 rounded-xl border border-white/10 bg-white/5 shadow-inner space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{SUMMARY_MODE_LABELS[mode]}</h2>
            {summaryProvider && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-white/20 text-gray-400">
                {summaryProvider}
              </span>
            )}
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed">{summary}</pre>

          {/* Export / Share actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
              onClick={() => downloadTxt(summary)}
            >
              Download .txt
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition"
              onClick={() => downloadPdf(summary)}
            >
              Download .pdf
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
              onClick={() => shareSummary(summary)}
            >
              Share
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
