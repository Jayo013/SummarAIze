"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Link2 } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Alert from "./ui/Alert";
import { getErrorMessage } from "../lib/errors";

interface ShareInfo {
  token: string;
  url: string;
  expiresAt: string | null;
}

const EXPIRY_OPTIONS = [
  { label: "Never", value: "" },
  { label: "1 day", value: "1" },
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
];

export default function ShareButton({
  summaryId,
  apiBase,
  getToken,
}: {
  summaryId: string;
  apiBase: string;
  getToken: () => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [expiresIn, setExpiresIn] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/summaries/${summaryId}/share`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load share status.");
      setShare(data.share ?? null);
      setStatusLoaded(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load share status."));
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !statusLoaded) void loadStatus();
  }

  async function createLink() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/summaries/${summaryId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(expiresIn ? { expiresInDays: Number(expiresIn) } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create share link.");
      setShare(data.share);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create share link."));
    } finally {
      setLoading(false);
    }
  }

  async function revokeLink() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/summaries/${summaryId}/share`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to revoke share link.");
      }
      setShare(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to revoke share link."));
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!share) return;
    await navigator.clipboard.writeText(share.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="text-sm">
      <Button type="button" variant="outline" size="sm" onClick={toggle}>
        <Link2 className="size-3.5" aria-hidden="true" />
        {open ? "Hide public link" : "Public link"}
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
            <div className="mt-2 p-3 rounded-[var(--radius-md)] glass space-y-2 w-full max-w-md">
              {error && <Alert tone="danger">{error}</Alert>}
              {loading && !share ? (
                <p className="text-xs text-[var(--color-text-muted)]">Loading…</p>
              ) : share ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      readOnly
                      value={share.url}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 min-w-[180px] text-xs py-1.5"
                    />
                    <Button size="sm" onClick={copyLink}>
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button size="sm" variant="danger" onClick={revokeLink} disabled={loading}>
                      Revoke
                    </Button>
                  </div>
                  <p className="text-xs text-[var(--color-text-faint)]">
                    {share.expiresAt ? `Expires ${new Date(share.expiresAt).toLocaleString()}` : "Never expires"} · Anyone
                    with this link can view a read-only copy of the summary.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-auto text-xs py-1.5"
                    aria-label="Link expiration"
                  >
                    {EXPIRY_OPTIONS.map((o) => (
                      <option key={o.label} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                  <Button size="sm" onClick={createLink} loading={loading}>
                    Create link
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
