"use client";
import { useState, FormEvent } from "react";

const MAX_CHARS = 20000; // keep in sync with backend Zod schema

export default function Home() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fail fast if the env var is missing
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase && typeof window !== "undefined") {
    // Render a clear message for local dev misconfig
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-3xl font-bold">SummarAIze</h1>
        <p className="text-red-600">
          Missing <code>NEXT_PUBLIC_API_BASE</code> in <code>.env.local</code>.
          Add e.g. <code>NEXT_PUBLIC_API_BASE=http://localhost:4000/api</code> and restart <code>npm run dev</code>.
        </p>
      </main>
    );
  }

  async function handleSummarize(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_CHARS) {
      setError(`Input is too long (${trimmed.length} chars). Max is ${MAX_CHARS}.`);
      return;
    }

    setLoading(true);
    setSummary("");
    setError(null);

    try {
      const res = await fetch(`${apiBase}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      // Attempt to parse JSON either way for better error surfacing
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          typeof data?.error === "string"
            ? data.error
            : `Request failed (${res.status})`;
        throw new Error(msg);
      }

      setSummary(typeof data?.summary === "string" ? data.summary : "");
    } catch (err: any) {
      setError(err?.message || "Failed to summarize. Check backend/API key.");
    } finally {
      setLoading(false);
    }
  }

  const chars = text.length;
  const tooLong = chars > MAX_CHARS;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">SummarAIze</h1>
      <p className="text-sm text-gray-500">Paste your notes and click Summarize.</p>

      <form onSubmit={handleSummarize} className="space-y-3">
        <textarea
          className={`w-full h-48 p-3 rounded border outline-none ${
            tooLong ? "border-red-500" : ""
          }`}
          placeholder="Paste your notes here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={tooLong}
          aria-describedby="charHelp"
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span id="charHelp">
            {tooLong ? (
              <span className="text-red-600">
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
            onClick={() => void 0}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={!text.trim() || loading || tooLong}
          >
            {loading ? "Summarizing…" : "Summarize"}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {summary && (
        <section className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Summary</h2>
          <pre className="whitespace-pre-wrap">{summary}</pre>
        </section>
      )}
    </main>
  );
}
