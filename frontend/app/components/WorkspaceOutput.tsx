"use client";

import { motion } from "framer-motion";
import { Download, FileDown, Share2, Sparkles } from "lucide-react";
import GlassCard from "./ui/GlassCard";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import AIThinking from "./ui/AIThinking";
import Skeleton from "./ui/Skeleton";
import QualityBadge from "./QualityBadge";
import Badge from "./ui/Badge";
import ShareButton from "./ShareButton";
import ChatPanel from "./ChatPanel";
import { SUMMARY_MODE_LABELS, type SummaryMode } from "../summaryModes";

export default function WorkspaceOutput({
  loading,
  summary,
  summaryProvider,
  summaryId,
  mode,
  qualityScore,
  qualityFlags,
  error,
  isAuthenticated,
  apiBase,
  getToken,
  preferredExportFormat,
  onDownloadPreferred,
  onDownloadTxt,
  onDownloadPdf,
  onShare,
}: {
  loading: boolean;
  summary: string;
  summaryProvider: string;
  summaryId: string | null;
  mode: SummaryMode;
  qualityScore: number | null;
  qualityFlags: string[];
  error: string | null;
  isAuthenticated: boolean;
  apiBase: string;
  getToken: () => Promise<string>;
  preferredExportFormat: "txt" | "pdf";
  onDownloadPreferred: () => void;
  onDownloadTxt: () => void;
  onDownloadPdf: () => void;
  onShare: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}

      <GlassCard className="min-h-[24rem] flex flex-col">
        {loading ? (
          <>
            <AIThinking />
            <div className="space-y-2.5 mt-2">
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </>
        ) : summary ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">{SUMMARY_MODE_LABELS[mode]}</h2>
              {summaryProvider && <Badge>{summaryProvider}</Badge>}
              {qualityScore !== null && <QualityBadge score={qualityScore} flags={qualityFlags} />}
            </div>

            <p className="whitespace-pre-wrap leading-relaxed text-[var(--color-text)]">{summary}</p>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border)]">
              {isAuthenticated && (
                <Button size="sm" onClick={onDownloadPreferred} title="Uses your preferred export format from Settings">
                  <Download className="size-3.5" aria-hidden="true" />
                  Download ({preferredExportFormat})
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={onDownloadTxt}>
                <FileDown className="size-3.5" aria-hidden="true" />
                .txt
              </Button>
              <Button size="sm" variant="secondary" onClick={onDownloadPdf}>
                <FileDown className="size-3.5" aria-hidden="true" />
                .pdf
              </Button>
              <Button size="sm" variant="outline" onClick={onShare}>
                <Share2 className="size-3.5" aria-hidden="true" />
                Share
              </Button>
            </div>

            {isAuthenticated && summaryId && (
              <div className="flex flex-wrap gap-2">
                <ShareButton summaryId={summaryId} apiBase={apiBase} getToken={getToken} />
                <ChatPanel summaryId={summaryId} apiBase={apiBase} getToken={getToken} />
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
              <Sparkles className="size-5 text-[var(--color-accent-2)]" aria-hidden="true" />
            </span>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
              Your summary will appear here. Paste some text or upload a document to get started.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
