"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Alert from "./ui/Alert";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

const MAX_QUESTION_LENGTH = 2000;

export default function ChatPanel({
  summaryId,
  apiBase,
  getToken,
}: {
  summaryId: string;
  apiBase: string;
  getToken: () => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadHistory() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/summaries/${summaryId}/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load chat history.");
      setMessages(data.messages ?? []);
      setLoaded(true);
    } catch (err: any) {
      setError(err?.message || "Failed to load chat history.");
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) void loadHistory();
  }

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    if (trimmed.length > MAX_QUESTION_LENGTH) {
      setError(`Question is too long (max ${MAX_QUESTION_LENGTH} characters).`);
      return;
    }

    setLoading(true);
    setError(null);
    const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, role: "user", content: trimmed, createdAt: new Date().toISOString() },
    ]);
    setQuestion("");

    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/summaries/${summaryId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to get a reply.");
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticId),
        data.userMessage,
        data.assistantMessage,
      ]);
    } catch (err: any) {
      setError(err?.message || "Failed to get a reply.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setQuestion(trimmed);
    } finally {
      setLoading(false);
    }
  }

  async function clearChat() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/summaries/${summaryId}/chat`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to clear chat.");
      }
      setMessages([]);
    } catch (err: any) {
      setError(err?.message || "Failed to clear chat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-sm">
      <Button type="button" variant="outline" size="sm" onClick={toggle}>
        <MessageCircle className="size-3.5" aria-hidden="true" />
        {open ? "Hide chat" : "Ask about this"}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-[var(--radius-md)] glass space-y-3 w-full max-w-md">
              {error && <Alert tone="danger">{error}</Alert>}

              <div className="max-h-64 overflow-y-auto scroll-thin space-y-2 pr-1">
                {messages.length === 0 && !loading && (
                  <p className="text-xs text-[var(--color-text-faint)]">Ask a question about this summary.</p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs max-w-[85%] whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] text-white"
                          : "bg-white/10 text-[var(--color-text)]"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="flex items-center gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question…"
                  disabled={loading}
                  className="flex-1 text-xs py-1.5"
                />
                <Button type="submit" size="sm" disabled={loading || !question.trim()} loading={loading}>
                  <Send className="size-3.5" aria-hidden="true" />
                </Button>
              </form>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  disabled={loading}
                  className="text-xs text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] underline disabled:opacity-50"
                >
                  Clear chat
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
