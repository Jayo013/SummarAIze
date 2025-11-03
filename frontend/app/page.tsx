"use client";
import { useEffect, useState, FormEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const MAX_CHARS = 20000;
const LS_TEXT = "summarize:text";
const LS_RESUME = "summarize:resume";

export default function Home() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Restore textarea after redirects
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LS_TEXT);
    if (saved) setText(saved);
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
    setError(null);

    try {
      const token = await getApiToken();
      const res = await fetch(`${apiBase}/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: trimmed }),
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
    } catch (err: any) {
      setError(err?.message || "Failed to summarize.");
    } finally {
      setLoading(false);
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
          <h2 className="text-lg font-semibold">Summary</h2>
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
